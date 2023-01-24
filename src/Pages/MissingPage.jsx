import React from 'react';
import { Link } from 'react-router-dom';
import '../scss/App.scss';
import { Container, Row, Col } from 'react-bootstrap';

const MissingPage = () => {
  return (
    <Container>
      <Row className='missing-page-container'>
        <Col>
          <h1 className='missing-page-title'>404 - Page Not Found</h1>
          <p className='missing-page-description'>
            Sorry, the page you are looking for cannot be found. Click{' '}
            <Link to='/'>here</Link> to return to the home page.
          </p>
        </Col>
      </Row>
    </Container>
  );
};

export default MissingPage;
