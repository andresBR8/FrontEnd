import React, { useState, useEffect } from "react";
import axios from 'axios';
import { Button, Modal, TextField, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { RiAddLine, RiEditLine, RiDeleteBinLine, RiDownloadLine } from 'react-icons/ri';
import Swal from 'sweetalert2';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const GestionMantenimiento = () => {
  const [mantenimientos, setMantenimientos] = useState([]);
  const [activos, setActivos] = useState([]);
  const [newMantenimiento, setNewMantenimiento] = useState({
    fkActivoUnidad: '',
    fechaProgramada: new Date(),
    descripcion: '',
  });
  const [openModal, setOpenModal] = useState(false);
  const [editMantenimiento, setEditMantenimiento] = useState(null);
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchMantenimientos = async () => {
      try {
        const response = await axios.get(`${apiUrl}/mantenimiento`);
        setMantenimientos(response.data.data);
      } catch (error) {
        handleError(error, "Error al obtener los mantenimientos.");
      }
    };

    const fetchAssets = async () => {
      try {
        const response = await axios.get(`${apiUrl}/activo-unidad`);
        setActivos(response.data.data);
      } catch (error) {
        handleError(error, "Error al obtener los activos.");
      }
    };

    fetchMantenimientos();
    fetchAssets();
  }, [apiUrl]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMantenimiento({ ...newMantenimiento, [name]: value });
  };

  const handleAddMantenimiento = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${apiUrl}/mantenimiento`, newMantenimiento);
      setMantenimientos([...mantenimientos, response.data]);
      Swal.fire({
        title: 'Mantenimiento programado!',
        text: 'El mantenimiento ha sido programado con éxito.',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });
      setNewMantenimiento({ fkActivoUnidad: '', fechaProgramada: new Date(), descripcion: '' });
    } catch (error) {
      handleError(error, "Error al programar el mantenimiento.");
    }
  };

  const handleEditMantenimiento = (id) => {
    const mantenimiento = mantenimientos.find(m => m.id === id);
    setEditMantenimiento(mantenimiento);
    setOpenModal(true);
  };

  const handleUpdateMantenimiento = async () => {
    try {
      await axios.put(`${apiUrl}/mantenimiento/${editMantenimiento.id}`, editMantenimiento);
      setMantenimientos(mantenimientos.map(m => (m.id === editMantenimiento.id ? editMantenimiento : m)));
      toast.success("Mantenimiento actualizado correctamente.");
      setOpenModal(false);
      setEditMantenimiento(null);
    } catch (error) {
      handleError(error, "Error al actualizar el mantenimiento.");
    }
  };

  const handleDeleteMantenimiento = async (id) => {
    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: "Se eliminará el mantenimiento programado.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${apiUrl}/mantenimiento/${id}`);
        setMantenimientos(mantenimientos.filter(m => m.id !== id));
        toast.success("Mantenimiento eliminado correctamente.");
      } catch (error) {
        handleError(error, "Error al eliminar el mantenimiento.");
      }
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Reporte de Mantenimientos", 20, 10);
    doc.autoTable({
      head: [['ID', 'Fecha Programada', 'Descripción', 'Activo']],
      body: mantenimientos.map(mantenimiento => [
        mantenimiento.id,
        new Date(mantenimiento.fechaProgramada).toLocaleDateString(),
        mantenimiento.descripcion,
        mantenimiento.activoUnidad?.codigo || 'N/A'
      ])
    });
    doc.save('reporte_mantenimientos.pdf');
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(mantenimientos.map(mantenimiento => ({
      ID: mantenimiento.id,
      Fecha_Programada: new Date(mantenimiento.fechaProgramada).toLocaleDateString(),
      Descripción: mantenimiento.descripcion,
      Activo: mantenimiento.activoUnidad?.codigo || 'N/A'
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mantenimientos');
    XLSX.writeFile(workbook, 'reporte_mantenimientos.xlsx');
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

  return (
    <div className="min-h-screen p-4 flex flex-col items-center">
      <div className="bg-secondary-100 p-8 rounded-xl shadow-2xl w-full lg:w-3/4">
        <h1 className="text-3xl text-center uppercase font-bold tracking-[5px] text-white mb-8">
          Gestión de Mantenimientos
        </h1>
        <form className="mb-8 flex flex-col gap-4" onSubmit={handleAddMantenimiento}>
          <FormControl variant="outlined" fullWidth required>
            <InputLabel>Unidad de Activo</InputLabel>
            <Select
              name="fkActivoUnidad"
              value={newMantenimiento.fkActivoUnidad}
              onChange={handleInputChange}
              label="Unidad de Activo"
            >
              <MenuItem value="">
                <em>Seleccione Unidad de Activo</em>
              </MenuItem>
              {activos.map(asset => (
                <MenuItem key={asset.id} value={asset.id}>
                  {asset.codigo} - {asset.activoModelo.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <DatePicker
            selected={newMantenimiento.fechaProgramada}
            onChange={(date) => setNewMantenimiento({ ...newMantenimiento, fechaProgramada: date })}
            className="py-3 px-4 bg-secondary-900 w-full outline-none rounded-lg text-emi_azul"
            required
          />
          <TextField
            type="text"
            name="descripcion"
            label="Descripción"
            value={newMantenimiento.descripcion}
            onChange={handleInputChange}
            variant="outlined"
            fullWidth
            required
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            className="uppercase font-bold text-sm w-full py-3 px-4 mt-4 bg-emi_azul text-emi_amarillo hover:bg-black transition-colors"
            startIcon={<RiAddLine />}
          >
            Programar Mantenimiento
          </Button>
        </form>
        <div className="flex gap-4 mb-8">
          <Button
            onClick={exportToPDF}
            variant="contained"
            color="primary"
            startIcon={<RiDownloadLine />}
            className="bg-emi_azul text-emi_amarillo hover:bg-black transition-colors"
          >
            Exportar PDF
          </Button>
          <Button
            onClick={exportToExcel}
            variant="contained"
            color="secondary"
            startIcon={<RiDownloadLine />}
            className="bg-emi_azul text-emi_amarillo hover:bg-black transition-colors"
          >
            Exportar Excel
          </Button>
        </div>
        <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="py-3 px-6">ID</th>
                <th scope="col" className="py-3 px-6">Fecha Programada</th>
                <th scope="col" className="py-3 px-6">Descripción</th>
                <th scope="col" className="py-3 px-6">Activo</th>
                <th scope="col" className="py-3 px-6">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {mantenimientos.length > 0 ? (
                mantenimientos.map((mantenimiento) => (
                  <tr key={mantenimiento.id} className="bg-white border-b dark:bg-white dark:border-emi_azul hover:bg-yellow-400 dark:hover:bg-emi_azul-900">
                    <td className="py-1 px-2 lg:px-6">{mantenimiento.id}</td>
                    <td className="py-1 px-2 lg:px-6">{new Date(mantenimiento.fechaProgramada).toLocaleDateString()}</td>
                    <td className="py-1 px-2 lg:px-6">{mantenimiento.descripcion}</td>
                    <td className="py-1 px-2 lg:px-6">{mantenimiento.activoUnidad?.codigo || 'N/A'}</td>
                    <td className="py-1 px-2 lg:px-6 text-right space-x-4 lg:space-x-7">
                      <Button variant="contained" color="primary" onClick={() => handleEditMantenimiento(mantenimiento.id)}>
                        <RiEditLine />
                      </Button>
                      <Button variant="contained" color="secondary" onClick={() => handleDeleteMantenimiento(mantenimiento.id)}>
                        <RiDeleteBinLine />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-4">No hay datos disponibles</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <ToastContainer />
      </div>

      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <div className="bg-secondary-100 p-8 rounded-xl shadow-2xl w-full lg:w-1/2 mx-auto mt-20">
          <h2 className="text-2xl text-center uppercase font-bold tracking-[5px] text-white mb-8">
            Editar Mantenimiento
          </h2>
          {editMantenimiento && (
            <>
              <FormControl variant="outlined" fullWidth required>
                <InputLabel>Unidad de Activo</InputLabel>
                <Select
                  name="fkActivoUnidad"
                  value={editMantenimiento.fkActivoUnidad}
                  onChange={(e) => setEditMantenimiento({ ...editMantenimiento, fkActivoUnidad: e.target.value })}
                  label="Unidad de Activo"
                >
                  <MenuItem value="">
                    <em>Seleccione Unidad de Activo</em>
                  </MenuItem>
                  {activos.map(asset => (
                    <MenuItem key={asset.id} value={asset.id}>
                      {asset.codigo} - {asset.activoModelo.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <DatePicker
                selected={new Date(editMantenimiento.fechaProgramada)}
                onChange={(date) => setEditMantenimiento({ ...editMantenimiento, fechaProgramada: date })}
                className="py-3 px-4 bg-secondary-900 w-full outline-none rounded-lg text-emi_azul mt-4"
                required
              />
              <TextField
                type="text"
                name="descripcion"
                label="Descripción"
                value={editMantenimiento.descripcion}
                onChange={(e) => setEditMantenimiento({ ...editMantenimiento, descripcion: e.target.value })}
                variant="outlined"
                fullWidth
                required
              />
              <Button
                variant="contained"
                color="primary"
                className="uppercase font-bold text-sm w-full py-3 px-4 mt-4 bg-emi_azul text-emi_amarillo hover:bg-black transition-colors"
                onClick={handleUpdateMantenimiento}
              >
                Actualizar Mantenimiento
              </Button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default GestionMantenimiento;
