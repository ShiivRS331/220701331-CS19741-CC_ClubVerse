import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import styled from "styled-components";

const PageContainer = styled.div`
  max-width: 800px;
  margin: 50px auto;
  padding: 20px;
  background-color: #f2f2f2;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
`;

const FormContainer = styled.form`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-top: 20px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  margin: auto; /* Added to center the form */
`;

const InputGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
`;

const SubmitButton = styled.button`
  grid-column: span 2;
  width: 100%;
  padding: 10px;
  background-color: #3498db;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover:not(:disabled) {
    background-color: #2980b9;
  }

  &:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
`;

const CreateAdmin = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    clubName: "",
    securityKey: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
 
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    
    // Validate security key
    if (formData.securityKey !== 'admin-secret-key-2024') {
      toast.error("❌ Invalid security key. Please enter: admin-secret-key-2024", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 5000,
      });
      return;
    }
    
    setIsLoading(true);
    
    try{
        const response = await fetch("http://localhost:5000/super/createAdmin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! Status: ${response.status}`);
      }

      console.log("Success:", data.message);
      toast.success("✅ Admin account created successfully! Please go to login page and select 'Club Admin' role to access your dashboard.", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 5000,
        onClose: () => {
          navigate("/login");
        },
      });

    }catch(error){
        console.error("Error creating admin:", error.message);
        toast.error(`❌ Error: ${error.message}`, {
            position: toast.POSITION.TOP_RIGHT,
            autoClose: 5000,
          });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer>
      <h1>Create Admin</h1>
      <FormContainer onSubmit={handleSubmit}>
        <InputGroup>
          <Label>Head of Club Name:</Label>
          <Input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
        </InputGroup>
        <InputGroup>
          <Label>Email for Admin:</Label>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
        </InputGroup>
        <InputGroup>
          <Label>Password for Admin:</Label>
          <Input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
          />
        </InputGroup>
        <InputGroup>
          <Label>Club Name:</Label>
          <Input
            type="text"
            name="clubName"
            value={formData.clubName}
            onChange={handleChange}
          />
        </InputGroup>
        <InputGroup>
          <Label>Security Key:</Label>
          <Input
            type="text"
            name="securityKey"
            value={formData.securityKey}
            onChange={handleChange}
            placeholder="Enter admin-secret-key-2024"
            required
          />
          <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
            Required security key: admin-secret-key-2024
          </small>
        </InputGroup>
        <SubmitButton type="submit" disabled={isLoading}>
          {isLoading ? "Creating Admin..." : "Create Admin"}
        </SubmitButton>
      </FormContainer>
    </PageContainer>
  );  
};

export default CreateAdmin;
