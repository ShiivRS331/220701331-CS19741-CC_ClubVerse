import React, { useState } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';

const SummarizeButton = styled.button`
  background: #3498db;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  box-shadow: 0 2px 4px rgba(52, 152, 219, 0.2);

  &:hover:not(:disabled) {
    background: #2980b9;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    background: #95a5a6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const SummaryModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 24px;
  border-radius: 8px;
  width: 500px;
  max-width: 90vw;
  max-height: 80vh;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid #e0e0e0;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e0e0e0;
`;

const ModalTitle = styled.h3`
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  font-size: 18px;
  cursor: pointer;
  color: #6c757d;
  padding: 6px 12px;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background: #e9ecef;
    color: #495057;
  }
`;

const SummaryContent = styled.div`
  line-height: 1.6;
  color: #333;
  font-size: 14px;
`;

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #666;
`;

const ErrorMessage = styled.div`
  background: #f8d7da;
  color: #721c24;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  margin: 8px 0;
`;

const PostSummarizeButton = ({ postTitle, postDescription, coordinators = [] }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);

  const handleSummarize = async () => {
    setIsLoading(true);
    setError(null);
    setShowModal(true);

    try {
      // Call backend API endpoint
      const response = await fetch('http://localhost:5000/user/summarize-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('token'))}`
        },
        body: JSON.stringify({
          postTitle,
          postDescription,
          coordinators: Array.isArray(coordinators) ? coordinators : [coordinators]
        })
      });

      const data = await response.json();

      if (data.success) {
        setSummary(data.summary);
        toast.success('Post summarized successfully!');
      } else {
        throw new Error(data.error || 'Failed to generate summary');
      }
    } catch (error) {
      console.error('Summarization error:', error);
      setError(error.message);
      toast.error('Failed to summarize post. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSummary('');
    setError(null);
  };

  return (
    <>
      <SummarizeButton onClick={handleSummarize} disabled={isLoading}>
        {isLoading ? '⏳' : '🧠'} 
        {isLoading ? 'Summarizing...' : 'Summarize'}
      </SummarizeButton>

      {showModal && (
        <SummaryModal onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>AI Summary</ModalTitle>
              <CloseButton onClick={closeModal}>×</CloseButton>
            </ModalHeader>
            
            {isLoading ? (
              <LoadingSpinner>
                <div>🤖 AI is analyzing the post...</div>
              </LoadingSpinner>
            ) : error ? (
              <ErrorMessage>
                {error}
              </ErrorMessage>
            ) : (
              <SummaryContent>
                <strong>Original Post:</strong>
                <div style={{ marginBottom: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <div><strong>Title:</strong> {postTitle}</div>
                  <div><strong>Description:</strong> {postDescription}</div>
                  {coordinators && coordinators.length > 0 && (
                    <div><strong>Coordinators:</strong> {Array.isArray(coordinators) ? coordinators.join(', ') : coordinators}</div>
                  )}
                </div>
                
                <strong>AI Summary:</strong>
                <div style={{ marginTop: '8px', padding: '12px', background: '#e3f2fd', borderRadius: '8px', borderLeft: '4px solid #2196f3' }}>
                  {summary}
                </div>
              </SummaryContent>
            )}
          </ModalContent>
        </SummaryModal>
      )}
    </>
  );
};

export default PostSummarizeButton;
