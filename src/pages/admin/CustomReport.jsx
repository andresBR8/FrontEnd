import React, { useState } from 'react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import * as XLSX from 'xlsx';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#E4E4E4',
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableCell: {
    margin: 'auto',
    marginTop: 5,
    fontSize: 10,
  },
});

const PDFDocument = ({ bajas }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>Reporte de Bajas</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>ID</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>Fecha</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>Unidad</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>Estado</Text>
            </View>
          </View>
          {bajas.map((baja) => (
            <View style={styles.tableRow} key={baja.id}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{baja.id}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{new Date(baja.fecha).toLocaleDateString()}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{baja.activoUnidad.codigo}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{baja.estado}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </Page>
  </Document>
);

const CustomReport = ({ bajas, onClose }) => {
  const [reportType, setReportType] = useState('pdf');

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      bajas.map((baja) => ({
        ID: baja.id,
        Fecha: new Date(baja.fecha).toLocaleDateString(),
        Unidad: baja.activoUnidad.codigo,
        Estado: baja.estado,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bajas");
    XLSX.writeFile(workbook, "reporte_bajas.xlsx");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Generar Reporte</h2>
        <div className="mb-4">
          <label className="block mb-2">Tipo de Reporte:</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="pdf">PDF</option>
            <option value="excel">Excel</option>
          </select>
        </div>
        {reportType === 'pdf' ? (
          <PDFDownloadLink document={<PDFDocument bajas={bajas} />} fileName="reporte_bajas.pdf">
            {({ blob, url, loading, error }) =>
              loading ? 'Generando PDF...' : 'Descargar PDF'
            }
          </PDFDownloadLink>
        ) : (
          <button onClick={handleExportExcel} className="bg-emi_azul text-white px-4 py-2 rounded">
            Descargar Excel
          </button>
        )}
        <button onClick={onClose} className="ml-4 bg-gray-300 px-4 py-2 rounded">
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default CustomReport;