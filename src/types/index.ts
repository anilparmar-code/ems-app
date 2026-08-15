export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Department {
  id: number;
  name: string;
  description: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Employee {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  designation: string;
  salary: number | null;
  department_id: number;
  status: 'active' | 'inactive';
  department?: Department;
  created_at?: string;
  updated_at?: string;
}
