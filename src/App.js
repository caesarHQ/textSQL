import React, { useState } from 'react';
import './App.css';

function SearchForm() {
  const [query, setQuery] =  useState('');

  return (
    <form onSubmit={() => {}} style={{'paddingTop': 300}}>
      <label>
        Query:
        <input type="text" value={query} onChange={e => setQuery(e.target.value)} />
      </label>
      <input type="submit" value="Submit" />
    </form>
  );
}

function App() {
  return (
    <div className="App">
      <h2 style={{'paddingTop': 200}}> Census GPT </h2>
      <SearchForm />
    </div>
  );
}

export default App;
