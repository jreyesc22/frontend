import React from 'react';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import QuestionForm from './components/QuestionForm';

function App() {
  return (
    <div className="App">
      <h1>Agente Inteligente</h1>
      <QuestionForm />
    </div>
  );
}

export default App;