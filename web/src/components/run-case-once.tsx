import { SpeedIndicator } from './speed-indicator'
import styled from '@emotion/styled'
import { useState, useContext, useRef } from 'react'
import { useRates } from '../hooks'
import { ChannelsContext, ConfigContext } from '../context'
import { SPEED_TEST_STORAGE_KEY } from '../const'
import { zip, interval, Subscription } from 'rxjs'
import { rateFormatters, normalizeBaseURL } from '../utils'
import { Button, Intent } from '@blueprintjs/core'
import { $textCenter, $mgt } from '../styles/utils'
import { css } from '@emotion/react'
import { take, mergeMap } from 'rxjs/operators'
import { pingws } from '../cases/ping'
import { showToast } from '../toaster'

const $Header = styled.div`
  display: flex;
`

const $HeaderCase = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  text-align: center;
`

const $CaseTitle = styled.div``
const $CaseContent = styled.div`
  font-size: 24px;
  font-weight: bold;
`

enum RunningStep {
  NONE = 1,
  PING,
  DOWNLOAD,
  UPLOAD,
  DONE,
  STOP
}

const RunningStepLabels: Record<RunningStep, string> = {
  [RunningStep.NONE]: '开始测速',
  [RunningStep.DOWNLOAD]: 'Downloading',
  [RunningStep.PING]: 'Pinging',
  [RunningStep.UPLOAD]: 'Uploading',
  [RunningStep.DONE]: '再次测速',
  [RunningStep.STOP]: '中止测速',
}

export function RunCaseOnce() {
  const [dlRate, setDlRate] = useState(-1)
  const [ulRate, setUlRate] = useState(-1)
  const [ttl, pushTTL, clearTTL] = useRates(5)
  const [step, setStep] = useState(RunningStep.NONE)
  const createChannels = useContext(ChannelsContext)
  const { duration, parallel, packCount, unit, baseURL } = useContext(ConfigContext)

  // 用于跟踪连续 WebSocket 连接失败的次数
  let failedPingCount = 0
  const sub = useRef<Subscription | null>(null)

  const _start = async () => {
    clearTTL()
    setStep(RunningStep.PING)
    // 重置连接失败计数
    failedPingCount = 0

    const normalizedBaseURL = normalizeBaseURL(baseURL)

    // 获取客户端 IP 信息（不影响后续流程）
    let _ipCtx: { clientIP?: string; clientIPInfo?: any } = {}
    try {
      const resp = await fetch(`${normalizedBaseURL}/ip`, { method: 'GET' })
      if (resp.ok) {
        const data = await resp.json()
        _ipCtx.clientIP = data?.ip
        if (data?.ipInfo !== undefined) _ipCtx.clientIPInfo = data.ipInfo
      }
    } catch (e) {
      console.warn('fetch ip failed', e)
    }

    sub.current = interval(500)
      .pipe(
        take(10),
        mergeMap(() => {
          // 捕获 pingws 可能的错误，并返回 Infinity 表示连接失败
          return pingws(normalizedBaseURL).catch(err => {
            console.error('WebSocket ping failed:', err)
            return Infinity
          })
        }),
      )
      .subscribe({
        next(v) {
          // 如果返回 Infinity，表示连接失败，检查连续失败次数
          if (v === Infinity) {
            // 连续失败超过3次，中止测速
            if (++failedPingCount >= 3) {
              sub.current?.unsubscribe()
              sub.current = null
              setStep(RunningStep.DONE)
              showToast({
                message: `WebSocket连接失败，请检查网络环境`,
                intent: Intent.WARNING,
                icon: "warning-sign",
              })
              return
            }
          } else {
            // 重置失败计数
            failedPingCount = 0
          }
          pushTTL(v)
        },
        complete() {
          createChannels().then(channels => {
            setStep(RunningStep.DOWNLOAD)
            sub.current = zip(
              ...channels.map((channel) =>
                channel.observe('download', {
                  duration,
                  packCount,
                  parallel,
                  interval: 500,
                  baseURL: normalizedBaseURL,
                }),
              ),
            ).subscribe({
              next(v) {
                setDlRate(v.reduce((a, b) => a + b, 0))
              },
              complete() {
                setStep(RunningStep.UPLOAD)
                sub.current = zip(
                  ...channels.map((channel) =>
                    channel.observe('upload', {
                      duration,
                      packCount,
                      parallel,
                      interval: 500,
                      baseURL: normalizedBaseURL,
                    }),
                  ),
                ).subscribe({
                  next(v) {
                    setUlRate(v.reduce((a, b) => a + b, 0))
                  },
                  async complete() {
                    setStep(RunningStep.DONE)
                    sub.current = null
                    await new Promise(resolve => setTimeout(resolve, 500))

                    const pingResult = document.getElementById('ping-result')?.textContent;
                    const downloadResult = document.getElementById('download-result')?.textContent;
                    const uploadResult = document.getElementById('upload-result')?.textContent;
                    const rawDlRate = document.getElementById('raw-download-rate')?.textContent;
                    const rawUlRate = document.getElementById('raw-upload-rate')?.textContent;

                    if (pingResult === '--' || downloadResult === '--' || uploadResult === '--' || rawDlRate === '-1' || rawUlRate === '-1') {
                      console.log("...")
                    } else {
                      // 保存测速结果
                      const storedResults = localStorage.getItem(SPEED_TEST_STORAGE_KEY)
                      const newResult = {
                        timestamp: Date.now(),
                        ping: pingResult,
                        download: downloadResult,
                        rawDlRate: rawDlRate,
                        rawUlRate: rawUlRate,
                        upload: uploadResult,
                        baseURL: normalizedBaseURL,
                        ip: _ipCtx.clientIP,
                        ipInfo: _ipCtx.clientIPInfo,
                      }

                      const results = storedResults ? JSON.parse(storedResults) : []
                      results.unshift(newResult)
                      localStorage.setItem(SPEED_TEST_STORAGE_KEY, JSON.stringify(results))
                    }

                    // 触发事件通知其他组件
                    window.dispatchEvent(new CustomEvent('speedTestResultsUpdated'))


                  },
                  error(e) {
                    console.error(e)
                    setStep(RunningStep.DONE)
                    sub.current = null
                  }
                })
              },
              error(e) {
                console.error(e)
                setStep(RunningStep.DONE)
                sub.current = null
              }
            })
          })
        },
        error(e) {
          console.error(e)
          setStep(RunningStep.DONE)
          sub.current = null
        }
      })
  }

  const start = () => {
    if (step !== RunningStep.NONE && step !== RunningStep.DONE) {
      sub.current?.unsubscribe()
      sub.current = null
      setStep(RunningStep.DONE)
      return
    }
    _start().catch(err => {
      showToast({
        message: `Error, Please check environment`,
        intent: Intent.DANGER,
        icon: "warning-sign",
      })
      setStep(RunningStep.DONE)
    })
  }

  return (
    <div>
      <$Header>
        <$HeaderCase>
          <$CaseTitle>Ping</$CaseTitle>
          <$CaseContent id="ping-result">{step >= RunningStep.PING ? `${ttl.toFixed(2)} ms` : '--'}</$CaseContent>
        </$HeaderCase>

        <$HeaderCase>
          <$CaseTitle>下载</$CaseTitle>
          <$CaseContent id="download-result">{step >= RunningStep.DOWNLOAD ? rateFormatters[unit](dlRate) : '--'}</$CaseContent>
          <div id="raw-download-rate" style={{ display: 'none' }}>{dlRate}</div>
        </$HeaderCase>

        <$HeaderCase>
          <$CaseTitle>上传</$CaseTitle>
          <$CaseContent id="upload-result">{step >= RunningStep.UPLOAD ? rateFormatters[unit](ulRate) : '--'}</$CaseContent>
          <div id="raw-upload-rate" style={{ display: 'none' }}>{ulRate}</div>
        </$HeaderCase>
      </$Header>
      <SpeedIndicator
        speed={step === RunningStep.DOWNLOAD ? dlRate : step === RunningStep.UPLOAD ? ulRate : undefined}
        running={step !== RunningStep.DONE && step !== RunningStep.NONE}
      />
      <div css={css`${$textCenter}${$mgt[4]}`}>
        <Button onClick={start}>
          {step !== RunningStep.NONE && step !== RunningStep.DONE ? RunningStepLabels[RunningStep.STOP] : RunningStepLabels[step]}
        </Button>
      </div>
    </div>
  )
}
