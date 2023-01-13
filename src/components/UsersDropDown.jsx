import React, { useEffect, useState } from 'react';
import { Form, Dropdown, Button } from 'react-bootstrap';

const SearchMember = ({ users, selectedUsers, setSelectedUsers }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle the toggle of the dropdown
  const handleToggle = () => setDropdownOpen(!dropdownOpen);

  // Handle the selection of an option
  const handleSelect = (value) => {
    setSelectedUsers([...selectedUsers, value]);
  };

  // Handle the removal of an option
  const handleRemove = (value) => {
    setSelectedUsers(selectedUsers.filter((v) => v !== value));
  };

  return (
    <section>
      <div className='row d-flex justify-content-center mt-100'>
        <div className='col-md-6'>
          <Dropdown onToggle={handleToggle} show={dropdownOpen}>
            <Dropdown.Toggle
              variant='secondary'
              id='dropdown-basic'
              className='d-flex align-items-center'
            >
              <input
                type='text'
                placeholder='Search...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ position: 'relative' }}
              />
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {users
                .filter((x) =>
                  x.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((x, i) => (
                  <Dropdown.Item key={i} onClick={() => handleSelect(x)}>
                    {x.name}
                  </Dropdown.Item>
                ))}
            </Dropdown.Menu>
          </Dropdown>
          <div className='selected-tags'>
            {selectedUsers.map((x, i) => (
              <Button
                variant='secondary'
                key={i}
                className='mr-2 mb-2'
                onClick={() => handleRemove(x)}
              >
                {x.name}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SearchMember;
