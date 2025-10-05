import React, { useState } from "react";
import styled from "styled-components";
import { toast } from "react-toastify";

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 30px;
  border-radius: 8px;
  width: 500px;
  max-width: 90vw;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
`;

const FormTitle = styled.h2`
  margin: 0 0 20px 0;
  color: #3498db;
  text-align: center;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #333;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  min-height: 100px;
  resize: vertical;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: background-color 0.3s;

  &.primary {
    background-color: #3498db;
    color: white;

    &:hover {
      background-color: #2980b9;
    }
  }

  &.secondary {
    background-color: #95a5a6;
    color: white;

    &:hover {
      background-color: #7f8c8d;
    }
  }
`;

const JoinForm = ({ clubName, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    reason: "",
    contactInfo: "",
    experience: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch("http://localhost:5000/user/joinClub", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `bearer ${JSON.parse(localStorage.getItem("token"))}`,
        },
        body: JSON.stringify({
          clubName,
          ...formData
        }),
      });

      if (response.ok) {
        toast.success("Join request submitted successfully!", {
          position: toast.POSITION.TOP_RIGHT,
        });
        onSubmit && onSubmit();
        onClose();
      } else {
        toast.error("Failed to submit join request", {
          position: toast.POSITION.TOP_RIGHT,
        });
      }
    } catch (error) {
      console.error("Error submitting join request:", error);
      toast.error("Error submitting join request", {
        position: toast.POSITION.TOP_RIGHT,
      });
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <FormTitle>Join {clubName}</FormTitle>
        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="reason">Why do you want to join this club?</Label>
            <TextArea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="Tell us why you're interested in joining..."
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="experience">Previous experience (optional)</Label>
            <TextArea
              id="experience"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              placeholder="Any relevant experience or skills..."
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="contactInfo">Contact Information</Label>
            <Input
              id="contactInfo"
              name="contactInfo"
              type="text"
              value={formData.contactInfo}
              onChange={handleChange}
              placeholder="Email or phone number"
              required
            />
          </FormGroup>

          <ButtonGroup>
            <Button type="button" className="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="primary">
              Submit Request
            </Button>
          </ButtonGroup>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default JoinForm;
