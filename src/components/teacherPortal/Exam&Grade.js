import React from 'react';
import ExamTable from './ExamTable';
//import './ExamGrade.css';

export default function ExamGrade() {
  return (
    <div className="container d-flex flex-column align-items-center justify-content-center min-vh-90  py-4
    " style={{
    
    }}>
      <div className="card shadow-lg w-100 p-4" style={{ maxWidth: '100%',
       background: "transparent"
       }}>
      <h3 className="mb-4" style={{ 
          textAlign: 'center', 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          color: '#0000ff', 
          textShadow: '2px 2px 5px rgba(0, 0, 0, 0.2)', 
          marginTop: '10px', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          background:'transparent',
          gap: '10px' 
        }}>
          📋 Exam Grades
        </h3>
        <ExamTable />
      </div>
    </div>
  );
}