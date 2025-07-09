import React, { useState, useEffect } from 'react';
import { Alert, Button, Badge } from 'antd';
import { WarningOutlined, ExclamationCircleOutlined, BugOutlined } from '@ant-design/icons';
import { useFlowStore } from '../stores/flowStore';
import './ValidationAlert.css';

interface ValidationAlertProps {
  onClose?: () => void;
  onViewDetails?: () => void;
}

const ValidationAlert: React.FC<ValidationAlertProps> = ({ onClose, onViewDetails }) => {
  const { validationErrors, toggleValidation } = useFlowStore();
  const [visible, setVisible] = useState(false);
  const [animatedClass, setAnimatedClass] = useState('');
  const [detailsVisible, setDetailsVisible] = useState(false);
  
  // Número de errores y advertencias
  const errorCount = validationErrors.filter(err => err.severity === 'error').length;
  const warningCount = validationErrors.filter(err => err.severity === 'warning').length;
  
  // Mostrar solo si hay errores o advertencias
  useEffect(() => {
    if (errorCount > 0 || warningCount > 0) {
      setVisible(true);
      setTimeout(() => setAnimatedClass('slide-in'), 100);
    } else {
      handleClose();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorCount, warningCount]);
  
  const handleClose = () => {
    setAnimatedClass('slide-out');
    setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, 300); // Duración de la animación
  };
  
  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails();
    } else {
      toggleValidation();
    }
    handleClose();
  };
  
  const toggleDetails = () => {
    setDetailsVisible(!detailsVisible);
  };
  
  if (!visible) return null;
  
  // Determinar tipo de alerta (error o warning)
  const alertType = errorCount > 0 ? 'error' : 'warning';
  const totalIssues = errorCount + warningCount;
  
  const message = (
    <div className="validation-alert-header">
      <span className="validation-alert-title">
        {errorCount > 0 
          ? <><ExclamationCircleOutlined /> Validación fallida</>
          : <><WarningOutlined /> Advertencias de validación</>
        }
      </span>
      <Badge count={totalIssues} overflowCount={99} className="validation-count-badge" />
    </div>
  );
  
  // Mostrar los primeros 3 errores en la descripción
  const topErrors = validationErrors
    .filter(err => err.severity === 'error')
    .slice(0, 2)
    .map(err => err.message);
    
  const topWarnings = validationErrors
    .filter(err => err.severity === 'warning')
    .slice(0, errorCount > 0 ? 1 : 2)
    .map(err => err.message);
  
  const description = (
    <div className="validation-alert-description">
      <p className="validation-summary">
        {errorCount > 0 
          ? `El flujo contiene ${errorCount} ${errorCount === 1 ? 'error' : 'errores'} y ${warningCount} ${warningCount === 1 ? 'advertencia' : 'advertencias'} que deben revisarse.`
          : `El flujo contiene ${warningCount} ${warningCount === 1 ? 'advertencia' : 'advertencias'} que podrían causar problemas.`
        }
      </p>
      
      {detailsVisible && (
        <div className="validation-details">
          {topErrors.length > 0 && (
            <div className="validation-errors-list">
              <div className="validation-category">Errores principales:</div>
              <ul>
                {topErrors.map((msg, idx) => (
                  <li key={`error-${idx}`}>{msg}</li>
                ))}
                {errorCount > topErrors.length && (
                  <li>...y {errorCount - topErrors.length} más</li>
                )}
              </ul>
            </div>
          )}
          
          {topWarnings.length > 0 && (
            <div className="validation-warnings-list">
              <div className="validation-category">Advertencias principales:</div>
              <ul>
                {topWarnings.map((msg, idx) => (
                  <li key={`warning-${idx}`}>{msg}</li>
                ))}
                {warningCount > topWarnings.length && (
                  <li>...y {warningCount - topWarnings.length} más</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
      
      <div className="validation-actions">
        <Button 
          size="small" 
          type="link" 
          onClick={toggleDetails}
          className="toggle-details-btn"
        >
          {detailsVisible ? "Ocultar detalles" : "Mostrar detalles"}
        </Button>
        <Button 
          size="small" 
          type="primary" 
          onClick={handleViewDetails}
          icon={<BugOutlined />}
        >
          Ver todo
        </Button>
      </div>
    </div>
  );
  
  return (
    <div className={`validation-alert ${animatedClass}`}>
      <Alert
        message={message}
        description={description}
        type={alertType}
        showIcon={false}
        closable
        onClose={handleClose}
        className="validation-alert-container"
      />
    </div>
  );
};

export default ValidationAlert;
