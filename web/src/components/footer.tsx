import React, { useState, useEffect } from 'react'
import { $talc } from '../styles/utils'
import styled from '@emotion/styled'
import { Var, ThemeVar } from '../styles/variable'
import { SPEED_TEST_STORAGE_KEY } from '../const'
import { Dialog, Button, Intent } from '@blueprintjs/core'

const FooterContainer = styled.div`
  ${$talc}
  color: ${Var(ThemeVar.FooterColor)};
  padding-top: 24px;
`

const SpeedResultsContainer = styled.div`
  margin-top: 16px;
  font-size: 13px;
  max-height: calc(80vh - 60px);
  min-height: 100px;
  overflow-y: auto;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.02);
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  @media (max-width: 768px) {
    max-height: calc(60vh - 60px);
    padding: 8px;
    font-size: 12px;
  }
`

const SpeedResultItem = styled.div`
  margin: 8px 0;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 8px;
  }
`

const ResultInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  
  .timestamp {
    color: ${Var(ThemeVar.FooterColor)};
    opacity: 0.7;
    font-size: 12px;
  }
  
  .metrics {
    display: flex;
    gap: 12px;
    
    .metric {
      display: inline-flex;
      align-items: center;
      
      .label {
        margin-right: 4px;
        opacity: 0.7;
      }
      
      .value {
        font-weight: 500;
      }
    }
  }
`

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: #ff4d4f;
  cursor: pointer;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  margin-left: auto;
  
  &:hover {
    background: rgba(255, 77, 79, 0.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
`

const DeleteActions = styled.div`
  display: flex;
  gap: 8px;
  margin-left: auto;

  @media (max-width: 768px) {
    margin-left: 0;
    width: 100%;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 6px;
  }
`

const ConfirmButton = styled.button`
  background: #ff4d4f;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #ff7875;
  }
`

const CancelButton = styled.button`
  background: none;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #1890ff;
    color: #1890ff;
  }
`

const ResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  font-weight: 600;
`

interface SpeedTestResult {
  timestamp: number
  ping: number
  download: number
  upload: number
  baseURL: string
}



export function Footer() {
  const [speedResults, setSpeedResults] = useState<SpeedTestResult[]>([])
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null)

  const [pendingDeleteIndex, setPendingDeleteIndex] = useState<number | null>(null)

  const showDeleteConfirm = (index: number) => {
    setPendingDeleteIndex(index)
  }

  const handleDeleteCancel = () => {
    setPendingDeleteIndex(null)
  }

  const handleDeleteConfirm = (index: number) => {
    const storedResults = localStorage.getItem(SPEED_TEST_STORAGE_KEY)
    if (storedResults) {
      try {
        const results = JSON.parse(storedResults)
        if (Array.isArray(results)) {
          // 删除指定索引的结果
          const newResults = results.filter((_, i) => i !== index)
          localStorage.setItem(SPEED_TEST_STORAGE_KEY, JSON.stringify(newResults))
          
          // 更新本地状态
          setSpeedResults(newResults.slice(0, 20))
          
          // 触发事件通知其他组件
          window.dispatchEvent(new CustomEvent('speedTestResultsUpdated'))
          
          // 关闭确认状态
          setPendingDeleteIndex(null)
        }
      } catch (e) {
        console.error('Failed to delete speed test result:', e)
      }
    }
  }

  useEffect(() => {
    const loadResults = () => {
      const storedResults = localStorage.getItem(SPEED_TEST_STORAGE_KEY)
      if (storedResults) {
        try {
          const results = JSON.parse(storedResults)
          setSpeedResults(Array.isArray(results) ? results.slice(0, 20) : [])
        } catch (e) {
          setSpeedResults([])
        }
      }
    }

    // 初始加载
    loadResults()

    // 监听测速结果更新事件
    const handleResultsUpdated = () => {
      loadResults()
    }

    window.addEventListener('speedTestResultsUpdated', handleResultsUpdated)

    // 清理事件监听器
    return () => {
      window.removeEventListener('speedTestResultsUpdated', handleResultsUpdated)
    }
  }, [])

  return (
    <FooterContainer>
      <div style={{ marginBottom: '12px' }}>
        测试结果通常只能代表当前设备性能下所能跑到的实际数据，没有任何理论参考价值，不能作为链路理论数据使用。
      </div>
      
      {speedResults.length > 0 && (
        <SpeedResultsContainer>
          <ResultsHeader>
            <div>最近测速结果</div>
            <div style={{ fontSize: '12px', opacity: 0.7, fontWeight: 'normal' }}>{speedResults.length} 条记录</div>
          </ResultsHeader>
          
          {speedResults.map((result, index) => (
            <SpeedResultItem key={index}>
              <ResultInfo>
                <div className="timestamp">
                  {new Date(result.timestamp).toLocaleString()}
                </div>

                <div className="metrics">
                  <div className="metric">
                    <span className="label">Ping:</span>
                    <span className="value">{result.ping}</span>
                  </div>
                  <div className="metric">
                    <span className="label">下载:</span>
                    <span className="value">{result.download}</span>
                  </div>
                  <div className="metric">
                    <span className="label">上传:</span>
                    <span className="value">{result.upload}</span>
                  </div>
                  <div className="metric">
                    <span className="label">服务器:</span>
                    <span className="value">{result.baseURL}</span>
                  </div>

                  {pendingDeleteIndex === index ? (
                  <DeleteActions>
                    <ConfirmButton onClick={() => handleDeleteConfirm(index)}>确认删除</ConfirmButton>
                    <CancelButton onClick={handleDeleteCancel}>取消</CancelButton>
                  </DeleteActions>
                ) : (
                  <DeleteButton onClick={() => showDeleteConfirm(index)}>删除</DeleteButton>
                )}


                </div> 
              </ResultInfo>
              
            </SpeedResultItem>
          ))}
        </SpeedResultsContainer>
      )}
      
      <Dialog
        isOpen={deleteConfirmIndex !== null}
        title="确认删除"
        onClose={handleDeleteCancel}
      >
        <div className="bp4-dialog-body">
          <p>确定要删除这条测速记录吗？此操作不可撤销。</p>
        </div>
        <div className="bp4-dialog-footer">
          <div className="bp4-dialog-footer-actions">
            <Button onClick={handleDeleteCancel}>取消</Button>
            <Button intent={Intent.DANGER} onClick={handleDeleteConfirm}>删除</Button>
          </div>
        </div>
      </Dialog>
    </FooterContainer>
  )
}
