"use client";

import { useState } from "react";

const Employee = ({ employee, onEdit, onDelete }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-4 flex flex-col items-start space-y-2 border">
      <h3 className="text-lg font-semibold">{employee.name}</h3>
      <p className="text-gray-600">{employee.role}</p>
      <p className="text-gray-500">{employee.email}</p>
      <div className="flex space-x-2 mt-2">
        <button onClick={() => onEdit(employee)} className="bg-blue-500 text-white px-3 py-1 rounded">
          Edit
        </button>
        <button onClick={() => onDelete(employee.id)} className="bg-red-500 text-white px-3 py-1 rounded">
          Delete
        </button>
      </div>
    </div>
  );
};

export default Employee;
