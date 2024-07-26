import React from 'react';
import { Link } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 text-center">
          <h1 className="text-4xl font-bold mb-4 text-red-600">¡Algo salió mal!</h1>
          <p className="text-xl mb-4">Lo sentimos, ha ocurrido un error inesperado.</p>
          <Link to="/" className="text-blue-500 hover:underline">Volver a la página principal</Link>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
