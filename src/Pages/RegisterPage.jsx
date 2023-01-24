import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Col, Row, Alert, Form, Button } from 'react-bootstrap';
import '../scss/App.scss';

const RegisterPage = () => {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({
    text: '',
    type: '',
  });
  const navigate = useNavigate();

  function register(e) {
    e.preventDefault();

    const newUser = {
      email: email,
      name: firstName,
      password: password,
      confirmPassword: confirmPassword,
    };

    fetch('/api/register', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newUser),
    })
      .then((response) => response.json())
      .then((data) => {
        const message = data.message ? data.message : data.error;
        const type = data.message ? 'success' : 'danger';
        setMessage({
          text: message,
          type: type,
        });

        setShowMessage(true);
        if (type == 'success') {
          setLoading(true);

          setTimeout(() => {
            setShowMessage(false);
            navigate('/');
          }, 2000);
        }
      });
  }

  return (
    <Container>
      <Row>
        <Col>
          <div className='register'>
            {showMessage && (
              <Row>
                <Col>
                  <Alert variant={message.type}>{message.text}</Alert>
                </Col>
              </Row>
            )}
            <Row>
              <Col className='register-container'>
                <div className='Heading'>
                  <h1>Register</h1>
                </div>
                <Form>
                  <Form.Group>
                    <Form.Control
                      style={{ textAlign: 'start' }}
                      className='form-control'
                      aria-describedby='emailHelp'
                      autoComplete='name'
                      placeholder='Name'
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Control
                      style={{ textAlign: 'start' }}
                      type='email'
                      className='form-control'
                      aria-describedby='emailHelp'
                      placeholder='Email'
                      autoComplete='email'
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Control
                      style={{ textAlign: 'start' }}
                      type='password'
                      className='form-control'
                      placeholder='Password'
                      autoComplete='password'
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Control
                      style={{ textAlign: 'start' }}
                      type='password'
                      className='form-control'
                      placeholder='Confirm password'
                      autoComplete='confirm-password'
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </Form.Group>

                  <Form.Group>
                    {loading ? (
                      <div className='spinner-border' role='status'></div>
                    ) : (
                      <Button
                        variant='primary'
                        type='submit'
                        onClick={register}
                      >
                        Submit
                      </Button>
                    )}
                  </Form.Group>
                </Form>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>
    </Container>
  );
};
export default RegisterPage;
