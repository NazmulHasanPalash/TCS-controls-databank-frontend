// src/components/RoleBadge.jsx
import React, { memo } from 'react';
import PropTypes from 'prop-types';
import './RoleBadge.css';

const ROLES = ['admin', 'moderator', 'operator'];

function normalizeRole(value) {
  const v = String(value || '')
    .trim()
    .toLowerCase();
  return ROLES.includes(v) ? v : 'operator';
}

function RoleBadge({ role = 'operator', className = '', title }) {
  const normalized = normalizeRole(role);
  const classes = `role-badge role-${normalized}${
    className ? ` ${className}` : ''
  }`;
  const aria = title || `User role: ${normalized}`;

  return (
    <span className={classes} title={aria} aria-label={aria} role="status">
      {normalized}
    </span>
  );
}

RoleBadge.propTypes = {
  role: PropTypes.oneOf(ROLES),
  className: PropTypes.string,
  title: PropTypes.string,
};

export default memo(RoleBadge);
