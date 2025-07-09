import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import FlowDesignerView from './views/FlowDesignerView';
import './App.css';

const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorBgBase: '#23272e',
          colorTextBase: '#ffffff',
        },
      }}
    >
      <Router>
        <Routes>
          <Route path="/" element={<FlowDesignerView />} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
};

export default App;
