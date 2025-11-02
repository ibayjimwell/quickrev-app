import React from 'react'
import { Link } from 'react-router-dom'

function NavLink({ icon: Icon, label, to, isActive }) {
  return (
    <>
        <Link
            to={to} // 👈 Use the 'to' prop for the route
            className={`flex items-center p-3 rounded-lg transition-colors ${
                isActive
                ? 'bg-indigo-100 text-indigo-700 font-semibold'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            >
            <Icon className="w-5 h-5 mr-3" />
            {label}
        </Link>
    </>
  )
}

export default NavLink