import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { RiCloseLine, RiFileAddLine, RiUploadLine, RiDeleteBin6Line, RiEdit2Line, RiInformationLine } from 'react-icons/ri';
import moment from 'moment-timezone';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDropzone } from 'react-dropzone';
import { message } from 'antd';

const RegisterActivos = ({ onClose, onSave }) => {
  const [partidas, setPartidas] = useState([]);
  const [activo, setActivo] = useState({
    fkPartida: '',
    nombre: '',
    descripcion: '',
    fechaIngreso: '',
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
  const [isUploading, setIsUploading] = useState(false);
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);  // Estado para controlar el guardado

  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchPartidas();
  }, []);


  const fetchPartidas = async () => {
    try {
      const response = await axios.get(`${apiUrl}/partida`);
      setPartidas(response.data.data);
    } catch (error) {
      console.error('Error fetching partidas:', error);
      toast.error('No se pudieron cargar las partidas.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setActivo(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const onDrop = useCallback(acceptedFiles => {
    const file = acceptedFiles[0];
    setSelectedFile(file);
    setFilePreview(URL.createObjectURL(file));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleRemoveFile = () => {
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    setSelectedFile(null);
    setFilePreview(null);
    setIsFileUploaded(false);
    setUploadedFileUrl(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Por favor selecciona un archivo antes de subirlo.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    setIsUploading(true);

    try {
      const response = await axios.post(`${apiUrl}/upload`, formData);
      const fileUrl = response.data.url;
      toast.success('Archivo subido exitosamente');
      setUploadedFileUrl(fileUrl);
      setActivo(prevState => ({
        ...prevState,
        ordenCompra: fileUrl
      }));
      setIsFileUploaded(true);
      setSelectedFile(null);
      setFilePreview(fileUrl);
    } catch (error) {
      console.error('Error al subir el archivo:', error);
      toast.error(error.response?.data?.message || 'Ocurrió un error al subir el archivo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddActivo = () => {
    if (
      !activo.fkPartida ||
      !activo.nombre ||
      !activo.descripcion ||
      !activo.costo ||
      !activo.estado ||
      !activo.codigoNuevo ||
      !activo.cantidad ||
      activo.createdBy === '' ||
      activo.cantidad < 1
    ) {
      toast.error('Por favor complete todos los campos obligatorios.');
      return;
    }

    const fechaIngreso = moment().tz('America/La_Paz').toISOString();

    setActivosList(prevList => [...prevList, {
      ...activo,
      costo: parseFloat(activo.costo),
      cantidad: parseInt(activo.cantidad, 10),
      fechaIngreso,
      ordenCompra: uploadedFileUrl || activo.ordenCompra
    }]);

    setActivo({
      fkPartida: '',
      nombre: '',
      descripcion: '',
      fechaIngreso: '',
      costo: '',
      estado: '',
      codigoNuevo: '',
      ordenCompra: uploadedFileUrl || '',
      createdBy: localStorage.getItem('role'),
      cantidad: 1,
    });

    setIsFileUploaded(false);
    setCurrentStep(2);
  };

  const handleEditActivo = (index) => {
    const activoToEdit = activosList[index];
    setActivo({
      ...activoToEdit
    });
    setActivosList(activosList.filter((_, i) => i !== index));
    setCurrentStep(1);
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
  
    setIsSaving(true);
    try {
      const response = await axios.post(`${apiUrl}/activo-modelo`, activosList);
      
      if (response.status === 200 || response.status === 201) {
        toast.success('Activos registrados exitosamente');
        setTimeout(() => {
          onClose();
        }, 2000); // Cierra el modal después de 2 segundos
      } else {
        throw new Error('Respuesta del servidor no exitosa');
      }
    } catch (error) {
      console.error('Error al registrar los activos:', error);
      
      if (error.response) {
        // El servidor respondió con un estado fuera del rango de 2xx
        toast.error(`Error del servidor: ${error.response.data.message || 'Ocurrió un error desconocido'}`);
      } else if (error.request) {
        // La solicitud fue hecha pero no se recibió respuesta
        toast.error('No se recibió respuesta del servidor. Por favor, verifica tu conexión.');
      } else {
        // Algo sucedió en la configuración de la solicitud que provocó un error
        toast.error('Error al preparar la solicitud. Por favor, intente de nuevo.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPartidas = useMemo(() => {
    return partidas.filter(partida => 
      partida.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [partidas, searchTerm]);

  return (
    <div className="flex items-center justify-center p-4 max-width: 900px;">
      <div className="relative bg-white p-7 rounded-lg shadow-lg w-full max-w-4xl overflow-y-auto max-h-[90vh] border border-emi_azul ">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          aria-label="Cerrar"
        >
          <RiCloseLine size="24" />
        </button>
        <h1 className="text-3xl text-center uppercase font-bold tracking-[5px] text-emi_azul mb-8">
          Registrar <span className="text-emi_amarillo">Activos</span>
        </h1>
  
        <div className="mb-6 flex justify-center">
          {[1, 2].map((step) => (
            <div key={step} className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mr-2 transition-all duration-300
            ${currentStep >= step 
              ? 'bg-emi_azul text-emi_amarillo border-2 border-emi_amarillo' 
              : 'bg-emi_amarillo text-emi_azul border-2 border-emi_azul'}`}>
              {step}
            </div>
          ))}
        </div>
  
        {currentStep === 1 && (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleAddActivo(); }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-emi_azul mb-1" htmlFor="partida">
                  Partida
                </label>
                <select
                  id="partida"
                  name="fkPartida"
                  value={activo.fkPartida}
                  onChange={(e) => setActivo(prevState => ({
                    ...prevState,
                    fkPartida: e.target.value ? parseInt(e.target.value, 10) : ''
                  }))}
                  className="w-full text-emi_azul p-2 border border-emi_amarillo rounded-md focus:ring-emi_azul focus:border-emi_azul"
                >
                  <option value="">Seleccione una partida</option>
                  {filteredPartidas.map((partida) => (
                    <option key={partida.id} value={partida.id}>{partida.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-emi_azul mb-1" htmlFor="nombre">
                  Nombre
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  placeholder="Ingrese el nombre del activo"
                  value={activo.nombre}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-emi_amarillo text-emi_azul rounded-md focus:ring-emi_azul focus:border-emi_azul"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-emi_azul mb-1" htmlFor="descripcion">
                  Descripción
                </label>
                <input
                  type="text"
                  id="descripcion"
                  name="descripcion"
                  placeholder="Ingrese una descripción del activo"
                  value={activo.descripcion}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-emi_amarillo text-emi_azul rounded-md focus:ring-emi_azul focus:border-emi_azul"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-emi_azul mb-1" htmlFor="cantidad">
                  Cantidad
                </label>
                <input
                  type="number"
                  id="cantidad"
                  name="cantidad"
                  placeholder="Ingrese la cantidad"
                  value={activo.cantidad}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full p-2 border border-emi_amarillo text-emi_azul rounded-md focus:ring-emi_azul focus:border-emi_azul"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-emi_azul mb-1" htmlFor="costo">
                  Valor/Costo Unitario
                </label>
                <input
                  type="number"
                  id="costo"
                  name="costo"
                  placeholder="Ingrese el costo del activo"
                  value={activo.costo}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-emi_amarillo text-emi_azul rounded-md focus:ring-emi_azul focus:border-emi_azul"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-emi_azul mb-1" htmlFor="estado">
                  Estado
                </label>
                <select
                  id="estado"
                  name="estado"
                  value={activo.estado}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-emi_amarillo text-emi_azul rounded-md focus:ring-emi_azul focus:border-emi_azul"
                >
                  <option value="">Seleccione el estado</option>
                  <option value="Nuevo">Nuevo</option>
                  <option value="Regular">Regular</option>
                  <option value="Malo">Malo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-emi_azul mb-1" htmlFor="codigoNuevo">
                  Código Nuevo
                </label>
                <input
                  type="text"
                  id="codigoNuevo"
                  name="codigoNuevo"
                  placeholder="Ingrese el nuevo código del activo"
                  value={activo.codigoNuevo}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-emi_amarillo text-emi_azul rounded-md focus:ring-emi_azul focus:border-emi_azul"
                />
              </div>
            </div>
  
            <div>
              <label className="block text-sm font-medium text-emi_azul mb-1">
                Orden de Compra (opcional)
              </label>
              {isFileUploaded || uploadedFileUrl ? (
                <div className="flex items-center space-x-2">
                  <a href={uploadedFileUrl || filePreview} target="_blank" rel="noopener noreferrer" className="text-emi_azul hover:underline">
                    Ver archivo subido
                  </a>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="text-red-500 hover:text-red-700"
                  >
                    Eliminar archivo
                  </button>
                </div>
              ) : (
                <div {...getRootProps()} className={`p-4 border-2 border-dashed rounded-md ${isDragActive ? 'border-emi_azul bg-blue-50' : 'border-emi_amarillo'}`}>
                  <input {...getInputProps()} />
                  <p className="text-center text-gray-600">Arrastra y suelta un archivo aquí, o haz clic para seleccionar uno</p>
                </div>
              )}
              {selectedFile && !isFileUploaded && (
                <button
                  type="button"
                  onClick={handleUpload}
                  className={`mt-2 py-2 px-4 ${isUploading ? 'bg-gray-400' : 'bg-emi_azul hover:bg-emi_azul-600'} text-emi_amarillo rounded-md transition duration-300`}
                  disabled={isUploading}
                >
                  {isUploading ? 'Subiendo...' : 'Subir archivo'}
                </button>
              )}
            </div>
  
            <div className="flex justify-end">
              <button
                type="submit"
                className="py-2 px-4 bg-emi_azul text-emi_amarillo rounded-md hover:bg-emi_azul-600 transition duration-300"
              >
                Añadir Activo
              </button>
            </div>
          </form>
        )}
  
        {currentStep === 2 && (
          <div>
            <h2 className="text-xl font-semibold text-emi_azul mb-4">Activos por registrar</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-emi_azul">
                  <tr>
                    {['Partida', 'Nombre', 'Descripción', 'Cantidad', 'Costo', 'Estado', 'Código Nuevo', 'Acciones'].map((header) => (
                      <th key={header} className="px-6 py-3 text-left text-xs font-medium text-emi_amarillo uppercase tracking-wider">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activosList.map((activo, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-emi_azul">{partidas.find(partida => partida.id === activo.fkPartida)?.nombre || ''}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-emi_azul">{activo.nombre}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-emi_azul">{activo.descripcion}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-emi_azul">{activo.cantidad}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-emi_azul">{activo.costo} Bs</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-emi_azul">{activo.estado}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-emi_azul">{activo.codigoNuevo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditActivo(index)}
                          className="text-indigo-600 hover:text-indigo-900 mr-2"
                        >
                          <RiEdit2Line size="1.25em" />
                          <span className="sr-only">Editar</span>
                        </button>
                        <button
                          onClick={() => handleRemoveActivo(index)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <RiDeleteBin6Line size="1.25em" />
                          <span className="sr-only">Eliminar</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className="py-2 px-4 bg-emi_azul text-emi_amarillo rounded-md hover:bg-emi_amarillo hover:text-emi_azul transition duration-300"
              >
                Agregar más activos
              </button>
              <button
                onClick={handleSubmit}
                className={`py-2 px-4 ${isSaving ? 'bg-emi_azul cursor-not-allowed' : 'bg-emi_azul hover:bg-emi_azul'} text-emi_amarillo rounded-md transition duration-300`}
                disabled={isSaving}
              >
                {isSaving ? 'Guardando...' : 'Guardar Todo'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterActivos;
