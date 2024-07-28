import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RiCloseLine } from 'react-icons/ri';
import moment from 'moment-timezone';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const RegisterActivos = ({ onClose, onSave }) => {
  const todayDate = moment().tz('America/La_Paz').format('YYYY-MM-DD');
  const [partidas, setPartidas] = useState([]);
  const [activo, setActivo] = useState({
    fkPartida: '',
    nombre: '',
    descripcion: '',
    fechaIngreso: todayDate,
    costo: '',
    estado: '',
    codigoNuevo: '',
    ordenCompra: '',
    createdBy: localStorage.getItem('role'),
    cantidad: 1,
  });
  const [activosList, setActivosList] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isFileUploaded, setIsFileUploaded] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    axios.get(`${apiUrl}/partida`)
      .then(response => {
        setPartidas(response.data.data);
      })
      .catch(error => console.error('Error fetching partidas:', error));
  }, [apiUrl]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setActivo(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setFilePreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    setSelectedFile(file);
    setFilePreview(URL.createObjectURL(file));
    setDragOver(false);
  };

  const handleRemoveFile = () => {
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    setSelectedFile(null);
    setFilePreview(null);
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast.error('Por favor selecciona un archivo antes de subirlo.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    setIsUploading(true);

    axios.post(`${apiUrl}/upload`, formData)
      .then((response) => {
        toast.success('Archivo subido exitosamente');
        setActivo(prevState => ({
          ...prevState,
          ordenCompra: response.data.url
        }));
        setIsFileUploaded(true);
        setSelectedFile(null);
        setFilePreview(response.data.url);
      })
      .catch((error) => {
        console.error('Error al subir el archivo:', error);
        toast.error(error.response?.data?.message || 'Ocurrió un error al subir el archivo.');
      })
      .finally(() => {
        setIsUploading(false);
      });
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleAddActivo = () => {
    if (
      !activo.fkPartida ||
      !activo.nombre ||
      !activo.descripcion ||
      !activo.fechaIngreso ||
      !activo.costo ||
      !activo.estado ||
      !activo.codigoNuevo ||
      !activo.cantidad ||
      activo.createdBy == localStorage.getItem('role') ||
      activo.cantidad < 1
    ) {
      toast.error('Por favor complete todos los campos obligatorios.');
      return;
    }

    setActivosList([...activosList, {
      ...activo,
      costo: parseFloat(activo.costo),
      cantidad: parseInt(activo.cantidad, 10),
      fechaIngreso: moment(activo.fechaIngreso).tz('America/La_Paz').toISOString()
    }]);
    setActivo({
      fkPartida: '',
      nombre: '',
      descripcion: '',
      fechaIngreso: todayDate,
      costo: '',
      estado: '',
      codigoNuevo: '',
      ordenCompra: activo.ordenCompra,
      createdBy: localStorage.getItem('role'),
      cantidad: 1,
    });
    setIsFileUploaded(false);
  };

  const handleEditActivo = (index) => {
    const activoToEdit = activosList[index];
    setActivo({
      ...activoToEdit,
      fechaIngreso: moment(activoToEdit.fechaIngreso).format('YYYY-MM-DD')
    });
    setActivosList(activosList.filter((_, i) => i !== index));
  };

  const handleRemoveActivo = (index) => {
    setActivosList(activosList.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (activosList.length === 0) {
      toast.error('No hay activos para registrar.');
      return;
    }

    for (const activo of activosList) {
      try {
        await axios.post(`${apiUrl}/activo-modelo`, activo);
        toast.success('Activo registrado exitosamente');
      } catch (error) {
        console.error('Error al registrar el activo:', error);
        toast.error('Ocurrió un error al registrar el activo.');
      }
    }
    onSave();
    onClose();
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div className="relative bg-secondary-100 p-7 rounded-3xl shadow-3xl w-full lg:w-[800px] xl:w-[1000px] overflow-y-auto max-h-[80vh]">
        <button
          onClick={onClose}
          className="absolute top-0 right-0 text-2xl p-2 text-primary hover:text-white"
          aria-label="Cerrar"
        >
          <RiCloseLine />
        </button>
        <h1 className="text-3xl text-center uppercase font-bold tracking-[5px] text-white mb-8">
          Registrar <span className="text-primary">Activo</span>
        </h1>
        <form className="grid grid-cols-1 md:grid-cols-3 gap-6" onSubmit={handleSubmit}>
        <div className="col-span-1 flex flex-col text-white">
            <label className="mb-4">Orden de Compra:</label>
            <div
              className={`mb-4 border-dashed border-2 ${dragOver ? 'border-green-500' : 'border-gray-300'} rounded-lg p-4 text-center cursor-pointer`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.querySelector('input[type="file"]').click()}
            >
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                disabled={isFileUploaded}
              />
              {filePreview ? (
                <div>
                  <img src={filePreview} alt="Vista previa del archivo" className="mx-auto mb-4 max-h-48" />
                  {!isFileUploaded && (
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="text-red-500"
                    >
                      Eliminar archivo
                    </button>
                  )}
                </div>
              ) : (
                <span>Arrastra y suelta un archivo aquí, o haz clic para seleccionar uno.</span>
              )}
            </div>
            {!isFileUploaded && (
              <button
                type="button"
                onClick={handleUpload}
                className={`py-2 px-4 ${isUploading ? 'bg-gray-400' : 'bg-primary'} text-white rounded-lg`}
                disabled={isUploading}
              >
                {isUploading ? 'Subiendo...' : 'Subir archivo'}
              </button>
            )}
          </div>
          <div className="col-span-1">
            <label className="flex flex-col text-white">
              Partida:
              <select
                name="fkPartida"
                value={activo.fkPartida}
                onChange={(e) => setActivo(prevState => ({
                  ...prevState,
                  fkPartida: parseInt(e.target.value, 10)
                }))}
                className="py-2 pl-4 pr-4 bg-secondary-900 outline-none rounded-lg text-black"
              >
                <option value="">Seleccione una partida</option>
                {partidas.map((partida) => (
                  <option key={partida.id} value={partida.id}>{partida.nombre}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-white">
              Nombre:
              <input
                type="text"
                name="nombre"
                value={activo.nombre}
                onChange={handleInputChange}
                className="py-2 pl-4 pr-4 bg-secondary-900 outline-none rounded-lg text-black"
              />
            </label>
            <label className="flex flex-col text-white">
              Descripción:
              <input
                type="text"
                name="descripcion"
                value={activo.descripcion}
                onChange={handleInputChange}
                className="py-2 pl-4 pr-4 bg-secondary-900 outline-none rounded-lg text-black"
              />
            </label>
            <label className="flex flex-col text-white">
              Fecha de Ingreso:
              <input
                type="date"
                name="fechaIngreso"
                value={activo.fechaIngreso}
                onChange={handleInputChange}
                className="py-2 pl-4 pr-4 bg-secondary-900 outline-none rounded-lg text-black"
              />
            </label>
            <label className="flex flex-col text-white">
              Cantidad:
              <input
                type="number"
                name="cantidad"
                value={activo.cantidad}
                onChange={handleInputChange}
                min="1"
                className="py-2 pl-4 pr-4 bg-secondary-900 outline-none rounded-lg text-black"
              />
            </label>
          </div>
          <div className="col-span-1">
            <label className="flex flex-col text-white">
              Valor/Costo:
              <input
                type="number"
                name="costo"
                value={activo.costo}
                onChange={handleInputChange}
                className="py-2 pl-4 pr-4 bg-secondary-900 outline-none rounded-lg text-black"
              />
            </label>
            <label className="flex flex-col text-white">
              Estado:
              <select
                name="estado"
                value={activo.estado}
                onChange={handleInputChange}
                className="py-2 pl-4 pr-4 bg-secondary-900 outline-none rounded-lg text-black"
              >
                <option value="">Seleccione el estado</option>
                <option value="Nuevo">Nuevo</option>
                <option value="Regular">Regular</option>
                <option value="Malo">Malo</option>
              </select>
            </label>
            <label className="flex flex-col text-white">
              Código Nuevo:
              <input
                type="text"
                name="codigoNuevo"
                value={activo.codigoNuevo}
                onChange={handleInputChange}
                className="py-2 pl-4 pr-4 bg-secondary-900 outline-none rounded-lg text-black"
              />
            </label>
          </div>
          {activosList.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl text-center text-white mb-4">Activos por registrar</h2>
            <ul className="list-disc list-inside text-white">
              {activosList.map((activo, index) => (
                <li key={index}>
                  {activo.nombre} (Cantidad: {activo.cantidad})
                  <button
                    onClick={() => handleEditActivo(index)}
                    className="ml-4 text-blue-500 hover:text-blue-700"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleRemoveActivo(index)}
                    className="ml-4 text-red-500 hover:text-red-700"
                  >
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
          
          <button
            type="button"
            onClick={handleAddActivo}
            className="col-span-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
          >
            Añadir Activo
          </button>
          <button
            type="submit"
            className="col-span-1 md:col-span-2 bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark"
          >
            Guardar Todo
          </button>
        </form>
        
      </div>
      <ToastContainer />
    </div>
  );
};

export default RegisterActivos;
