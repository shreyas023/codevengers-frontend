"use client";

import { useState } from "react";
import Employee from "../components/Employee";
import { employees as initialEmployees } from "../data/employees";

export default function Page() {
  const [employees, setEmployees] = useState(initialEmployees);
  const [newEmployee, setNewEmployee] = useState({ name: "", role: "", email: "" });
  const [editEmployee, setEditEmployee] = useState(null);

  const handleAddEmployee = () => {
    if (!newEmployee.name || !newEmployee.role || !newEmployee.email){
      alert("Please fill in all fields.");
      return;
    }
    setEmployees([...employees, { id: Date.now(), ...newEmployee }]);
    setNewEmployee({ name: "", role: "", email: "" });
  };

  const handleDeleteEmployee = (id) => {
    setEmployees(employees.filter((emp) => emp.id !== id));
  };

  const handleEditEmployee = (employee) => {
    setEditEmployee(employee);
    setNewEmployee(employee);
  };

  const handleUpdateEmployee = () => {
    setEmployees(employees.map((emp) => (emp.id === editEmployee.id ? newEmployee : emp)));
    setEditEmployee(null);
    setNewEmployee({ name: "", role: "", email: "" });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-6">User Management Panel</h1>

      <div className="bg-white p-4 shadow-md rounded-lg mb-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-2">{editEmployee ? "Edit Employee" : "Add Employee"}</h2>
        <input
          type="text"
          placeholder="Name"
          className="border p-2 w-full mb-2 rounded"
          value={newEmployee.name}
          onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
        />
        <input
          type="text"
          placeholder="Role"
          className="border p-2 w-full mb-2 rounded"
          value={newEmployee.role}
          onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
        />
        <input
          type="email"
          placeholder="Email"
          className="border p-2 w-full mb-2 rounded"
          value={newEmployee.email}
          onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
        />
        {editEmployee ? (
          <button onClick={handleUpdateEmployee} className="bg-green-500 text-white w-full py-2 rounded">
            Update Employee
          </button>
        ) : (
          <button onClick={handleAddEmployee} className="bg-blue-500 text-white w-full py-2 rounded">
            Add Employee
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4 w-full max-w-4xl">
        {employees.map((employee) => (
          <Employee key={employee.id} employee={employee} onEdit={handleEditEmployee} onDelete={handleDeleteEmployee} />
        ))}
      </div>
    </div>
  );
}
