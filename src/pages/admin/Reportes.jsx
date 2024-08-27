import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import axios from 'axios';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import CustodyDocument from './PDFReporte';

const apiUrl = import.meta.env.VITE_API_URL;

const ReportesCombinados = () => {
    const [reportType, setReportType] = useState('inventory');
    const [reportData, setReportData] = useState([]);
    const [selectedModelo, setSelectedModelo] = useState('');
    const [estado, setEstado] = useState('');
    const [modelos, setModelos] = useState([]);
    const [showPDF, setShowPDF] = useState(false);

    useEffect(() => {
        fetchModelos();
    }, []);

    useEffect(() => {
        fetchReportData();
    }, [reportType, selectedModelo, estado]);

    const fetchModelos = async () => {
        try {
            const response = await axios.get(`${apiUrl}/activo-modelo`);
            setModelos(response.data.data);
        } catch (error) {
            Swal.fire('Error', 'No se pudo obtener los modelos de activos', 'error');
        }
    };

    const fetchReportData = async () => {
        try {
            const params = {};
            if (reportType === 'activos-por-modelo') {
                params.fkActivoModelo = selectedModelo;
            } else if (reportType === 'activos-por-estado') {
                params.estado = estado;
            }

            const response = await axios.get(`${apiUrl}/reportes/${reportType}`, { params });
            setReportData(response.data.data);
        } catch (error) {
            Swal.fire('Error', 'No se pudo obtener los datos del reporte', 'error');
        }
    };

    const exportPDF = () => {
        setShowPDF(true);
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold text-emi_azul">Reportes de Gestión de Activos</h1>
            <div className="flex space-x-4 mt-4">
                <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="text-sm p-2 border-2 rounded-lg bg-white text-emi_azul">
                    <option value="inventory">Inventario de Activos</option>
                    <option value="activos-por-modelo">Activos por Modelo</option>
                    <option value="activos-por-estado">Activos por Estado</option>
                </select>
                {reportType === 'activos-por-modelo' && (
                    <div className="mt-4">
                        <label htmlFor="modelo-select" className="block text-emi_azul">Selecciona el modelo:</label>
                        <select
                            id="modelo-select"
                            value={selectedModelo}
                            onChange={(e) => setSelectedModelo(e.target.value)}
                            className="text-sm p-2 border-2 rounded-lg bg-white text-emi_azul mt-2"
                        >
                            <option value="">Selecciona un modelo</option>
                            {modelos.map(modelo => (
                                <option key={modelo.id} value={modelo.id}>{modelo.nombre}</option>
                            ))}
                        </select>
                    </div>
                )}
                {reportType === 'activos-por-estado' && (
                    <div className="mt-4">
                        <label htmlFor="estado-select" className="block text-emi_azul">Selecciona el estado:</label>
                        <select
                            id="estado-select"
                            value={estado}
                            onChange={(e) => setEstado(e.target.value)}
                            className="text-sm p-2 border-2 rounded-lg bg-white text-emi_azul mt-2"
                        >
                            <option value="">Selecciona un estado</option>
                            <option value="Bueno">Bueno</option>
                            <option value="Regular">Regular</option>
                            <option value="Malo">Malo</option>
                        </select>
                    </div>
                )}
            </div>
            <div className="mt-4">
                <button onClick={exportPDF} className="bg-emi_azul text-white py-2 px-4 rounded-lg hover:bg-emi_amarillo">Generar PDF</button>
                <PDFDownloadLink 
                    document={
                        <CustodyDocument 
                            title={`Reporte de ${reportType}`} 
                            data={{
                                nombre: "Administrador",
                                cargo: "Administrador de Activos",
                                unidad: "Unidad de Activos Fijos",
                                descripcionReporte: `Este es un reporte de ${reportType}.`,
                            }} 
                            activos={reportData}
                        />
                    }
                    fileName={`${reportType}_report.pdf`}
                    className="bg-emi_azul text-white py-2 px-4 rounded-lg hover:bg-emi_amarillo ml-2"
                >
                    {({ loading }) => loading ? 'Cargando PDF...' : 'Descargar PDF'}
                </PDFDownloadLink>
            </div>
            <div className="overflow-x-auto relative shadow-md sm:rounded-lg mt-8">
                <table className="w-full text-sm text-left text-emi_azul">
                    <thead className="text-xs uppercase bg-emi_azul text-emi_amarillo">
                        <tr>
                            <th scope="col" className="py-3 px-6">ID</th>
                            <th scope="col" className="py-3 px-6">Código</th>
                            <th scope="col" className="py-3 px-6">Nombre del Modelo</th>
                            <th scope="col" className="py-3 px-6">Estado</th>
                            <th scope="col" className="py-3 px-6">Costo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData && reportData.length > 0 ? (
                            reportData.map((item, index) => (
                                <tr key={index} className="bg-white border-b">
                                    <td className="py-4 px-6">{item.id}</td>
                                    <td className="py-4 px-6">{item.codigo}</td>
                                    <td className="py-4 px-6">{item.activoModelo.nombre}</td>
                                    <td className="py-4 px-6">{item.activoModelo.estado}</td>
                                    <td className="py-4 px-6">{item.activoModelo.costo}</td>
                              
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="text-center py-4">No hay datos disponibles</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {showPDF && (
                <PDFViewer style={{ width: '100%', height: '500px' }}>
                    <CustodyDocument 
                        title={`Reporte de ${reportType}`} 
                        data={{
                            nombre: "Administrador",
                            cargo: "Administrador de Activos",
                            unidad: "Unidad de Activos Fijos",
                            descripcionReporte: `Este es un reporte de ${reportType}.`,
                        }} 
                        activos={reportData}
                    />
                </PDFViewer>
            )}
        </div>
    );
};

export default ReportesCombinados;
