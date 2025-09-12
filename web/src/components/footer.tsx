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
  max-height: calc(75vh - 60px);
  min-height: 100px;
  overflow-y: auto;
  border-radius: 6px;
  background: ${Var(ThemeVar.SpeedTestBg)};
  padding: 12px;
  box-shadow: ${Var(ThemeVar.SpeedTestShadow)};
  
  /* 滚动条样式 */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${Var(ThemeVar.ScrollbarTrackBg)};
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${Var(ThemeVar.ScrollbarThumbBg)};
    border-radius: 4px;
    border: 2px solid ${Var(ThemeVar.ScrollbarTrackBg)};
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: ${Var(ThemeVar.ScrollbarThumbHoverBg)};
  }
  
  /* Firefox 滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: ${Var(ThemeVar.ScrollbarThumbBg)} ${Var(ThemeVar.ScrollbarTrackBg)};
  
  @media (max-width: 768px) {
    max-height: calc(60vh - 60px);
    padding: 8px;
    font-size: 12px;
    margin: 12px -8px 0;
    border-radius: 0;
    background: ${Var(ThemeVar.SpeedTestBg)};
    
    &::-webkit-scrollbar {
      width: 6px;
    }
    
    &::-webkit-scrollbar-track {
      border-radius: 3px;
    }
    
    &::-webkit-scrollbar-thumb {
      border: 1px solid ${Var(ThemeVar.ScrollbarTrackBg)};
      border-radius: 3px;
    }
  }
  
  @media (max-width: 480px) {
    font-size: 11px;
    padding: 6px;
    margin: 12px -6px 0;
    
    &::-webkit-scrollbar {
      width: 4px;
    }
  }
`

const SpeedResultItem = styled.div`
  margin: 8px 0;
  padding: 12px;
  background: ${Var(ThemeVar.SpeedTestItemBg)};
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  box-shadow: ${Var(ThemeVar.SpeedTestItemShadow)};
  transition: all 0.2s ease;
  border: 1px solid ${Var(ThemeVar.SpeedTestBorder)};
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: ${Var(ThemeVar.SpeedTestItemHoverShadow)};
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: 10px;
    margin: 6px 0;
    border-radius: 6px;
  }
  
  @media (max-width: 480px) {
    padding: 8px;
    gap: 6px;
    margin: 4px 0;
  }
`

const ResultInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  flex: 1;
  position: relative;
  
  .timestamp {
    color: ${Var(ThemeVar.FooterColor)};
    opacity: 0.8;
    font-size: 11px;
    font-weight: 500;
    position: relative;
    
    .delete-container {
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    
    @media (min-width: 769px) {
      &:hover .delete-container {
        opacity: 1;
      }
    }
    
    @media (max-width: 768px) {
      .delete-container {
        opacity: 1;
      }
    }
  }
  
  .metrics {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
    align-items: center;
    
    .metric {
      display: inline-flex;
      align-items: center;
      white-space: nowrap;
      
      .label {
        margin-right: 3px;
        opacity: 0.7;
        font-size: 0.95em;
      }
      
      .value {
        font-weight: 600;
        font-size: 0.95em;
      }
    }
  }
  
  @media (max-width: 768px) {
    gap: 4px;
    
    .timestamp {
      font-size: 10px;
    }
    
    .metrics {
      gap: 6px 8px;
      
      .metric {
        .label {
          font-size: 0.9em;
        }
        
        .value {
          font-size: 0.9em;
        }
      }
    }
  }
  
  @media (max-width: 480px) {
    .metrics {
      gap: 4px 6px;
      
      .metric {
        .label {
          margin-right: 2px;
          font-size: 0.85em;
        }
        
        .value {
          font-size: 0.85em;
        }
      }
    }
  }
`

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: ${Var(ThemeVar.DeleteButtonColor)};
  cursor: pointer;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 4px;
  transition: all 0.2s ease;
  margin-left: 12px;
  min-width: 44px;
  min-height: 32px;
  
  &:hover {
    background: ${Var(ThemeVar.DeleteButtonHoverBg)};
  }
  
  &:active {
    transform: scale(0.95);
    background: ${Var(ThemeVar.DeleteButtonActiveBg)};
  }
  
  @media (max-width: 768px) {
    margin-left: 0;
    align-self: flex-end;
    min-width: 40px;
    min-height: 28px;
    padding: 5px 8px;
    font-size: 11px;
  }
  
  @media (max-width: 480px) {
    min-width: 36px;
    min-height: 26px;
    padding: 4px 6px;
    font-size: 10px;
  }
`

const DeleteActions = styled.div`
  display: flex;
  gap: 8px;
  margin-left: 12px;
  align-items: center;

  @media (max-width: 768px) {
    margin-right: 0;
    width: 100%;
    justify-content: flex-end;
    gap: 6px;
    margin-top: 4px;
  }
  
  @media (max-width: 480px) {
    gap: 4px;
  }
`

const ConfirmButton = styled.button`
  background: ${Var(ThemeVar.ConfirmButtonBg)};
  color: var(${ThemeVar.ButtonTextColor});
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 60px;
  min-height: 32px;
  
  &:hover {
    background: ${Var(ThemeVar.ConfirmButtonHoverBg)};
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  @media (max-width: 768px) {
    min-width: 50px;
    min-height: 28px;
    padding: 5px 10px;
    font-size: 11px;
  }
  
  @media (max-width: 480px) {
    min-width: 45px;
    min-height: 26px;
    padding: 4px 8px;
    font-size: 10px;
  }
`

const CancelButton = styled.button`
  background: none;
  border: 1px solid ${Var(ThemeVar.CancelButtonBorder)};
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 60px;
  min-height: 32px;
  
  &:hover {
    border-color: ${Var(ThemeVar.CancelButtonHoverBorder)};
    color: ${Var(ThemeVar.CancelButtonHoverColor)};
    background: ${Var(ThemeVar.CancelButtonHoverBg)};
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  @media (max-width: 768px) {
    min-width: 50px;
    min-height: 28px;
    padding: 5px 10px;
    font-size: 11px;
  }
  
  @media (max-width: 480px) {
    min-width: 45px;
    min-height: 26px;
    padding: 4px 8px;
    font-size: 10px;
  }
`

const ResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid ${Var(ThemeVar.SpeedTestBorder)};
  font-weight: 600;
  
  @media (max-width: 768px) {
    margin-bottom: 8px;
    padding-bottom: 6px;
    font-size: 14px;
  }
  
  @media (max-width: 480px) {
    margin-bottom: 6px;
    padding-bottom: 4px;
    font-size: 13px;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
`

interface SpeedTestResult {
  timestamp: number
  ping: number
  download: number
  upload: number
  baseURL: string
  ip:string
  ipInfo:string
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
                  <span>{new Date(result.timestamp).toLocaleString()}</span>
                  <div className="delete-container">
                    {pendingDeleteIndex === index ? (
                      <DeleteActions>
                        <ConfirmButton onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleDeleteConfirm(index);
                        }}>确认删除</ConfirmButton>
                        <CancelButton onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleDeleteCancel();
                        }}>取消</CancelButton>
                      </DeleteActions>
                    ) : (
                      <DeleteButton onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        showDeleteConfirm(index);
                      }}>删除</DeleteButton>
                    )}
                  </div>
                </div>

                <div className="metrics">
                  <div className="metric">
                    <span className="label">Ping:</span>
                    <span className="value">{result.ping}ms</span>
                  </div>
                  <div className="metric">
                    <span className="label">下载:</span>
                    <span className="value">{result.download}Mbps</span>
                  </div>
                  <div className="metric">
                    <span className="label">上传:</span>
                    <span className="value">{result.upload}Mbps</span>
                  </div>

                  <div className="metric">
                    <span className="label">服务器:</span>
                    <span className="value">{result.baseURL}</span>
                  </div>

                  {(result.ip || result.ipInfo) && (
                    <div className="metric">
                      <span className="label">IP:</span>
                      <span className="value">
                        {result.ip && result.ipInfo 
                          ? `${result.ip}（${result.ipInfo}）`
                          : result.ip || result.ipInfo
                        }
                      </span>
                    </div>
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
