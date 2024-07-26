import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RiAddLine, RiEditLine, RiDeleteBinLine, RiDownloadLine } from 'react-icons/ri';
import Swal from 'sweetalert2';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Bar } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useSnackbar } from 'notistack';
import { Button, Modal, TextField, MenuItem } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const Depreciation = () => {
  const [depreciations, setDepreciations] = useState([]);
  const [assets, setAssets] = useState([]);
  const [methods] = useState(['Línea Recta', 'Saldos Decrecientes', 'Unidades de Producción']);
  const [newDepreciation, setNewDepreciation] = useState({
    fkActivoUnidad: '',
    fecha: '',
    valor: '',
    metodo: '',
    ajuste: '',
    revaluacion: ''
  });
  const [openModal, setOpenModal] = useState(false);
  const [editDepreciation, setEditDepreciation] = useState(null);

  const { enqueueSnackbar } = useSnackbar();
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchDepreciations = async () => {
      try {
        const response = await axios.get(`${apiUrl}/depreciacion`);
        setDepreciations(response.data.data);
      } catch (error) {
        handleError(error, "Error al obtener las depreciaciones.");
      }
    };

    const fetchAssets = async () => {
      try {
        const response = await axios.get(`${apiUrl}/activo-unidad`);
        setAssets(response.data.data);
      } catch (error) {
        handleError(error, "Error al obtener los activos.");
      }
    };

    fetchDepreciations();
    fetchAssets();
  }, [apiUrl]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewDepreciation({ ...newDepreciation, [name]: value });
  };

  const handleAddDepreciation = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${apiUrl}/depreciacion`, newDepreciation);
      setDepreciations([...depreciations, response.data]);
      Swal.fire({
        title: 'Depreciación agregada!',
        text: 'La depreciación ha sido añadida con éxito.',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });
      setNewDepreciation({ fkActivoUnidad: '', fecha: '', valor: '', metodo: '', ajuste: '', revaluacion: '' });
    } catch (error) {
      handleError(error, "Error al agregar la depreciación.");
    }
  };

  const handleEditDepreciation = (id) => {
    const dep = depreciations.find(d => d.id === id);
    setEditDepreciation(dep);
    setOpenModal(true);
  };

  const handleUpdateDepreciation = async () => {
    try {
      await axios.put(`${apiUrl}/depreciacion/${editDepreciation.id}`, editDepreciation);
      setDepreciations(depreciations.map(dep => (dep.id === editDepreciation.id ? editDepreciation : dep)));
      enqueueSnackbar("Depreciación actualizada correctamente.", { variant: 'success' });
      setOpenModal(false);
      setEditDepreciation(null);
    } catch (error) {
      handleError(error, "Error al actualizar la depreciación.");
    }
  };

  const handleDeleteDepreciation = async (id) => {
    try {
      await axios.delete(`${apiUrl}/depreciacion/${id}`);
      setDepreciations(depreciations.filter(dep => dep.id !== id));
      enqueueSnackbar("Depreciación eliminada correctamente.", { variant: 'success' });
    } catch (error) {
      handleError(error, "Error al eliminar la depreciación.");
    }
  };

  const calculateDepreciation = (asset, metodo) => {
    let depreciationValue;
    const { vidaUtil, porcentajeDepreciacion, costo } = asset.activoModelo.partida;
    const age = new Date().getFullYear() - new Date(asset.fechaIngreso).getFullYear();

    switch (metodo) {
      case 'Línea Recta':
        depreciationValue = (costo / vidaUtil) * age;
        break;
      case 'Saldos Decrecientes':
        depreciationValue = costo * Math.pow((1 - (porcentajeDepreciacion / 100)), age);
        break;
      case 'Unidades de Producción':
        depreciationValue = (costo / vidaUtil) * age; // Simplified, needs actual units produced data
        break;
      default:
        depreciationValue = 0;
    }

    return depreciationValue;
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Reporte de Depreciaciones", 20, 10);
    doc.autoTable({
      head: [['ID', 'Fecha', 'Valor', 'Método', 'Ajuste', 'Revaluación']],
      body: depreciations.map(dep => [
        dep.id,
        new Date(dep.fecha).toLocaleDateString(),
        dep.valor,
        dep.metodo,
        dep.ajuste,
        dep.revaluacion
      ])
    });
    doc.save('reporte_depreciaciones.pdf');
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(depreciations.map(dep => ({
      ID: dep.id,
      Fecha: new Date(dep.fecha).toLocaleDateString(),
      Valor: dep.valor,
      Método: dep.metodo,
      Ajuste: dep.ajuste,
      Revaluación: dep.revaluacion
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Depreciaciones');
    XLSX.writeFile(workbook, 'reporte_depreciaciones.xlsx');
  };

  const handleError = (error, message) => {
    if (error.response) {
      console.error('Error data:', error.response.data);
      console.error('Error status:', error.response.status);
      console.error('Error headers:', error.response.headers);
      enqueueSnackbar(`${message}: ${error.response.data.message || error.response.status}`, { variant: 'error' });
    } else if (error.request) {
      console.error('Error request:', error.request);
      enqueueSnackbar(`${message}: No se recibió respuesta del servidor.`, { variant: 'error' });
    } else {
      console.error('Error message:', error.message);
      enqueueSnackbar(`${message}: ${error.message}`, { variant: 'error' });
    }
  };

  const data = {
    labels: depreciations.map(dep => dep.metodo),
    datasets: [
      {
        label: 'Valor de Depreciación',
        data: depreciations.map(dep => dep.valor),
        backgroundColor: 'rgba(75, 192, 192, 0.6)'
      }
    ]
  };

  const options = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'fecha', headerName: 'Fecha', width: 150, valueGetter: (params) => new Date(params.row.fecha).toLocaleDateString() },
    { field: 'valor', headerName: 'Valor', width: 130 },
    { field: 'metodo', headerName: 'Método', width: 200 },
    { field: 'ajuste', headerName: 'Ajuste', width: 130 },
    { field: 'revaluacion', headerName: 'Revaluación', width: 130 },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 150,
      renderCell: (params) => (
        <div className="flex gap-2">
          <Button variant="contained" color="primary" onClick={() => handleEditDepreciation(params.row.id)}>
            <RiEditLine />
          </Button>
          <Button variant="contained" color="secondary" onClick={() => handleDeleteDepreciation(params.row.id)}>
            <RiDeleteBinLine />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen p-4 bg-login-background2 flex flex-col items-center">
      <div className="bg-secondary-100 p-8 rounded-xl shadow-2xl w-full lg:w-3/4">
        <h1 className="text-3xl text-center uppercase font-bold tracking-[5px] text-white mb-8">
          Depreciaciones
        </h1>
        <form className="mb-8 flex flex-col gap-4" onSubmit={handleAddDepreciation}>
          <TextField
            select
            name="fkActivoUnidad"
            label="Unidad de Activo"
            value={newDepreciation.fkActivoUnidad}
            onChange={handleInputChange}
            variant="outlined"
            fullWidth
            required
          >
            <MenuItem value="">
              <em>Seleccione Unidad de Activo</em>
            </MenuItem>
            {assets.map(asset => (
              <MenuItem key={asset.id} value={asset.id}>
                {asset.codigo} - {asset.activoModelo.nombre}
              </MenuItem>
            ))}
          </TextField>
          <DatePicker
            selected={new Date(newDepreciation.fecha)}
            onChange={(date) => setNewDepreciation({ ...newDepreciation, fecha: date.toISOString() })}
            className="py-3 px-4 bg-secondary-900 w-full outline-none rounded-lg text-emi_azul"
            required
          />
          <TextField
            select
            name="metodo"
            label="Método de Depreciación"
            value={newDepreciation.metodo}
            onChange={handleInputChange}
            variant="outlined"
            fullWidth
            required
          >
            <MenuItem value="">
              <em>Seleccione Método de Depreciación</em>
            </MenuItem>
            {methods.map(method => (
              <MenuItem key={method} value={method}>
                {method}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            type="number"
            name="valor"
            label="Valor"
            value={newDepreciation.valor}
            onChange={handleInputChange}
            variant="outlined"
            fullWidth
            required
          />
          <TextField
            type="number"
            name="ajuste"
            label="Ajuste (opcional)"
            value={newDepreciation.ajuste}
            onChange={handleInputChange}
            variant="outlined"
            fullWidth
          />
          <TextField
            type="number"
            name="revaluacion"
            label="Revaluación (opcional)"
            value={newDepreciation.revaluacion}
            onChange={handleInputChange}
            variant="outlined"
            fullWidth
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            className="uppercase font-bold text-sm w-full py-3 px-4 mt-4"
            startIcon={<RiAddLine />}
          >
            Agregar Depreciación
          </Button>
        </form>
        <div className="flex gap-4 mb-8">
          <Button
            onClick={exportToPDF}
            variant="contained"
            color="primary"
            startIcon={<RiDownloadLine />}
          >
            Exportar PDF
          </Button>
          <Button
            onClick={exportToExcel}
            variant="contained"
            color="secondary"
            startIcon={<RiDownloadLine />}
          >
            Exportar Excel
          </Button>
        </div>
        <div style={{ height: 400, width: '100%' }}>
          <DataGrid rows={depreciations} columns={columns} pageSize={5} />
        </div>
        <div className="my-8">
          <Bar data={data} options={options} />
        </div>
        <ToastContainer />
      </div>

      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <div className="bg-secondary-100 p-8 rounded-xl shadow-2xl w-full lg:w-1/2 mx-auto mt-20">
          <h2 className="text-2xl text-center uppercase font-bold tracking-[5px] text-white mb-8">
            Editar Depreciación
          </h2>
          {editDepreciation && (
            <>
              <TextField
                select
                name="fkActivoUnidad"
                label="Unidad de Activo"
                value={editDepreciation.fkActivoUnidad}
                onChange={(e) => setEditDepreciation({ ...editDepreciation, fkActivoUnidad: e.target.value })}
                variant="outlined"
                fullWidth
                required
              >
                <MenuItem value="">
                  <em>Seleccione Unidad de Activo</em>
                </MenuItem>
                {assets.map(asset => (
                  <MenuItem key={asset.id} value={asset.id}>
                    {asset.codigo} - {asset.activoModelo.nombre}
                  </MenuItem>
                ))}
              </TextField>
              <DatePicker
                selected={new Date(editDepreciation.fecha)}
                onChange={(date) => setEditDepreciation({ ...editDepreciation, fecha: date.toISOString() })}
                className="py-3 px-4 bg-secondary-900 w-full outline-none rounded-lg text-emi_azul mt-4"
                required
              />
              <TextField
                select
                name="metodo"
                label="Método de Depreciación"
                value={editDepreciation.metodo}
                onChange={(e) => setEditDepreciation({ ...editDepreciation, metodo: e.target.value })}
                variant="outlined"
                fullWidth
                required
              >
                <MenuItem value="">
                  <em>Seleccione Método de Depreciación</em>
                </MenuItem>
                {methods.map(method => (
                  <MenuItem key={method} value={method}>
                    {method}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                type="number"
                name="valor"
                label="Valor"
                value={editDepreciation.valor}
                onChange={(e) => setEditDepreciation({ ...editDepreciation, valor: e.target.value })}
                variant="outlined"
                fullWidth
                required
              />
              <TextField
                type="number"
                name="ajuste"
                label="Ajuste (opcional)"
                value={editDepreciation.ajuste}
                onChange={(e) => setEditDepreciation({ ...editDepreciation, ajuste: e.target.value })}
                variant="outlined"
                fullWidth
              />
              <TextField
                type="number"
                name="revaluacion"
                label="Revaluación (opcional)"
                value={editDepreciation.revaluacion}
                onChange={(e) => setEditDepreciation({ ...editDepreciation, revaluacion: e.target.value })}
                variant="outlined"
                fullWidth
              />
              <Button
                variant="contained"
                color="primary"
                className="uppercase font-bold text-sm w-full py-3 px-4 mt-4"
                onClick={handleUpdateDepreciation}
              >
                Actualizar Depreciación
              </Button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Depreciation;
