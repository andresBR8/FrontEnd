import React from 'react'
import { PDFViewer } from '@react-pdf/renderer'
import AssetReturnPDF from './AssetReturnPDF'

export default function App() {
  const data = {
    employeeName: "Juan Pérez",
    employeeId: "EMP001",
    department: "IT",
    returnDate: "2023-06-15",
    assets: [
      { id: "LT001", name: "Laptop Dell XPS", condition: "Buena", notes: "Algunos rasguños menores" },
      { id: "PH001", name: "iPhone 12", condition: "Excelente", notes: "Sin daños visibles" },
      { id: "AC001", name: "Cargador Laptop", condition: "Regular", notes: "Cable desgastado" }
    ]
  }

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <PDFViewer width="100%" height="100%">
        <AssetReturnPDF data={data} />
      </PDFViewer>
    </div>
  )
}