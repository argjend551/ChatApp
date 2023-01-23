import React, { useEffect, useState } from 'react';
import { Dropdown, Button } from 'react-bootstrap';

const UsersDropDown = ({
  users,
  selectedUsers,
  setSelectedUsers,
  setUsers,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleToggle = () => setDropdownOpen(!dropdownOpen);

  const handleSelect = (value) => {
    setSelectedUsers([...selectedUsers, value]);
    setUsers(users.filter((x) => x.id !== value.id));
  };

  const handleRemove = (value) => {
    setSelectedUsers(selectedUsers.filter((x) => x !== value));
    setUsers([...users, value]);
  };

  return (
    <div>
      <Dropdown
        className='userSearchDropdown'
        onToggle={handleToggle}
        show={dropdownOpen}
      >
        <Dropdown.Toggle>
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
      <div className='selected-user-dropdown'>
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
  );
};

export default UsersDropDown;
