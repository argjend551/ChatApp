import React from 'react';
import { Link } from 'react-router-dom';
import '../scss/App.scss';

export default function MissingPage() {
  return (
    <div className='missing-page-container'>
      <h1 className='missing-page-title'>404 - Page Not Found</h1>
      <p className='missing-page-description'>
        Sorry, the page you are looking for cannot be found. Click{' '}
        <Link to='/'>here</Link> to return to the home page.
      </p>
    </div>
  );
}
