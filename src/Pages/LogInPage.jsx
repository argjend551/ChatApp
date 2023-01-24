import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Alert, Button } from 'react-bootstrap';
import '../scss/App.scss';

const LogInPage = ({ loggedIn }) => {
  const [email, setEmail] = useState('');
  const [password, setpassword] = useState('');
  const [showWrongLogin, setWrongLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({
    text: '',
    type: '',
  });
  let navigate = useNavigate();

  useEffect(() => {
    if (loggedIn) {
      navigate('/myProfile');
    }
  }, [loggedIn]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (email && password) {
      await login();
    }
  };

  async function login() {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });
      const data = await response.json();
      const message = data.message ? data.message : data.error;
      const type = data.loggedIn ? 'success' : 'danger';
      setMessage({
        text: message,
        type: type,
      });

      setWrongLogin(true);
      if (type == 'success') {
        setWrongLogin(false);
        setLoading(true);
        setTimeout(() => {
          navigate('/myProfile');
        }, 2000);
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <Container>
      <Row>
        <Col>
          <div className='login'>
            {showWrongLogin && (
              <Row>
                <Col>
                  <Alert variant={message.type}>{message.text}</Alert>
                </Col>
              </Row>
            )}
            <Row>
              <Col>
                <div className='login-container'>
                  <div className='Heading'>
                    {loading ? <h1>Logging in...</h1> : <h1>Login</h1>}
                  </div>
                  <form onSubmit={handleSubmit}>
                    <Row>
                      <Col>
                        <div className='form-group'>
                          <input
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
                        </div>
                      </Col>
                    </Row>
                    <Row>
                      <Col>
                        <div className='form-group'>
                          <input
                            style={{ textAlign: 'start' }}
                            type='password'
                            className='form-control'
                            placeholder='Password'
                            autoComplete='current-password'
                            value={password}
                            onChange={(e) => setpassword(e.target.value)}
                            disabled={loading}
                            required
                          />
                        </div>
                      </Col>
                    </Row>
                    <Row>
                      <Col>
                        <div className='form-group'>
                          {loading ? (
                            <div className='spinner-border' role='status'></div>
                          ) : (
                            <Button type='submit'>Login</Button>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </form>
                  <Row>
                    <Col>
                      {!loading ? (
                        <Link to={'/register'}>
                          <Button style={{ margin: '5px' }}>
                            Create new account
                          </Button>
                        </Link>
                      ) : (
                        <></>
                      )}
                    </Col>
                  </Row>
                </div>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>
    </Container>
  );
};
export default LogInPage;
