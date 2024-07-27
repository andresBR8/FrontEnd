import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DataGrid } from '@mui/x-data-grid';
import { Button, Modal, TextField, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { RiAddLine, RiDeleteBinLine, RiDownloadLine } from 'react-icons/ri';
import Swal from 'sweetalert2';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const Baja = () => {
  const [bajas, setBajas] = useState([]);
  const [assets, setAssets] = useState([]);
  const [newBaja, setNewBaja] = useState({
    fkActivoUnidad: '',
    fecha: new Date(),
    motivo: '',
  });
  const [openModal, setOpenModal] = useState(false);
  const [editBaja, setEditBaja] = useState(null);
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchBajas = async () => {
      try {
        const response = await axios.get(`${apiUrl}/baja`);
        setBajas(response.data.data);
      } catch (error) {
        handleError(error, "Error al obtener las bajas.");
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

    fetchBajas();
    fetchAssets();
  }, [apiUrl]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBaja({ ...newBaja, [name]: value });
  };

  const handleAddBaja = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${apiUrl}/baja`, newBaja);
      setBajas([...bajas, response.data]);
      Swal.fire({
        title: 'Baja agregada!',
        text: 'La baja ha sido añadida con éxito.',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });
      setNewBaja({ fkActivoUnidad: '', fecha: new Date(), motivo: '' });
    } catch (error) {
      handleError(error, "Error al agregar la baja.");
    }
  };

  const handleEditBaja = (id) => {
    const baja = bajas.find(b => b.id === id);
    setEditBaja(baja);
    setOpenModal(true);
  };

  const handleUpdateBaja = async () => {
    try {
      await axios.put(`${apiUrl}/baja/${editBaja.id}`, editBaja);
      setBajas(bajas.map(b => (b.id === editBaja.id ? editBaja : b)));
      toast.success("Baja actualizada correctamente.");
      setOpenModal(false);
      setEditBaja(null);
    } catch (error) {
      handleError(error, "Error al actualizar la baja.");
    }
  };

  const handleDeleteBaja = async (id) => {
    try {
      await axios.delete(`${apiUrl}/baja/${id}`);
      setBajas(bajas.filter(b => b.id !== id));
      toast.success("Baja eliminada correctamente.");
    } catch (error) {
      handleError(error, "Error al eliminar la baja.");
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Reporte de Bajas", 20, 10);
    doc.autoTable({
      head: [['ID', 'Fecha', 'Motivo', 'Activo']],
      body: bajas.map(baja => [
        baja.id,
        new Date(baja.fecha).toLocaleDateString(),
        baja.motivo,
        baja.activoUnidad.codigo
      ])
    });
    doc.save('reporte_bajas.pdf');
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(bajas.map(baja => ({
      ID: baja.id,
      Fecha: new Date(baja.fecha).toLocaleDateString(),
      Motivo: baja.motivo,
      Activo: baja.activoUnidad.codigo
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bajas');
    XLSX.writeFile(workbook, 'reporte_bajas.xlsx');
  };

  const handleError = (error, message) => {
    if (error.response) {
      console.error('Error data:', error.response.data);
      console.error('Error status:', error.response.status);
      console.error('Error headers:', error.response.headers);
      toast.error(`${message}: ${error.response.data.message || error.response.status}`);
    } else if (error.request) {
      console.error('Error request:', error.request);
      toast.error(`${message}: No se recibió respuesta del servidor.`);
    } else {
      console.error('Error message:', error.message);
      toast.error(`${message}: ${error.message}`);
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'fecha', headerName: 'Fecha', width: 150, valueGetter: (params) => new Date(params.row.fecha).toLocaleDateString() },
    { field: 'motivo', headerName: 'Motivo', width: 250 },
    { field: 'activoUnidad', headerName: 'Activo', width: 150, valueGetter: (params) => params.row.activoUnidad.codigo },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 150,
      renderCell: (params) => (
        <div className="flex gap-2">
          <Button variant="contained" color="primary" onClick={() => handleEditBaja(params.row.id)}>
            <RiAddLine />
          </Button>
          <Button variant="contained" color="secondary" onClick={() => handleDeleteBaja(params.row.id)}>
            <RiDeleteBinLine />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen p-4 flex flex-col items-center">
      <div className="bg-secondary-100 p-8 rounded-xl shadow-2xl w-full lg:w-3/4">
        <h1 className="text-3xl text-center uppercase font-bold tracking-[5px] text-white mb-8">
          Gestión de Bajas
        </h1>
        <form className="mb-8 flex flex-col gap-4" onSubmit={handleAddBaja}>
          <FormControl variant="outlined" fullWidth required>
            <InputLabel>Unidad de Activo</InputLabel>
            <Select
              name="fkActivoUnidad"
              value={newBaja.fkActivoUnidad}
              onChange={handleInputChange}
              label="Unidad de Activo"
            >
              <MenuItem value="">
                <em>Seleccione Unidad de Activo</em>
              </MenuItem>
              {assets.map(asset => (
                <MenuItem key={asset.id} value={asset.id}>
                  {asset.codigo} - {asset.activoModelo.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <DatePicker
            selected={newBaja.fecha}
            onChange={(date) => setNewBaja({ ...newBaja, fecha: date })}
            className="py-3 px-4 bg-secondary-900 w-full outline-none rounded-lg text-emi_azul"
            required
          />
          <TextField
            type="text"
            name="motivo"
            label="Motivo"
            value={newBaja.motivo}
            onChange={handleInputChange}
            variant="outlined"
            fullWidth
            required
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            className="uppercase font-bold text-sm w-full py-3 px-4 mt-4"
            startIcon={<RiAddLine />}
          >
            Agregar Baja
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
          <DataGrid rows={bajas} columns={columns} pageSize={5} />
        </div>
        <ToastContainer />
      </div>

      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <div className="bg-secondary-100 p-8 rounded-xl shadow-2xl w-full lg:w-1/2 mx-auto mt-20">
          <h2 className="text-2xl text-center uppercase font-bold tracking-[5px] text-white mb-8">
            Editar Baja
          </h2>
          {editBaja && (
            <>
              <FormControl variant="outlined" fullWidth required>
                <InputLabel>Unidad de Activo</InputLabel>
                <Select
                  name="fkActivoUnidad"
                  value={editBaja.fkActivoUnidad}
                  onChange={(e) => setEditBaja({ ...editBaja, fkActivoUnidad: e.target.value })}
                  label="Unidad de Activo"
                >
                  <MenuItem value="">
                    <em>Seleccione Unidad de Activo</em>
                  </MenuItem>
                  {assets.map(asset => (
                    <MenuItem key={asset.id} value={asset.id}>
                      {asset.codigo} - {asset.activoModelo.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <DatePicker
                selected={new Date(editBaja.fecha)}
                onChange={(date) => setEditBaja({ ...editBaja, fecha: date })}
                className="py-3 px-4 bg-secondary-900 w-full outline-none rounded-lg text-emi_azul mt-4"
                required
              />
              <TextField
                type="text"
                name="motivo"
                label="Motivo"
                value={editBaja.motivo}
                onChange={(e) => setEditBaja({ ...editBaja, motivo: e.target.value })}
                variant="outlined"
                fullWidth
                required
              />
              <Button
                variant="contained"
                color="primary"
                className="uppercase font-bold text-sm w-full py-3 px-4 mt-4"
                onClick={handleUpdateBaja}
              >
                Actualizar Baja
              </Button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Baja;
