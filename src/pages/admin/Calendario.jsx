import React, { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Swal from 'sweetalert2';
import Modal from 'react-modal';
import moment from 'moment-timezone';


const localizer = momentLocalizer(moment);

const events = [
  {
    id: 0,
    title: 'Reunión de equipo',
    allDay: false,
    start: new Date(2024, 5, 11, 10, 0),
    end: new Date(2024, 5, 11, 12, 0),
  },
  {
    id: 1,
    title: 'Revisión de proyecto',
    allDay: false,
    start: new Date(2024, 5, 12, 14, 0),
    end: new Date(2024, 5, 12, 15, 0),
  },
  // Agrega más eventos según sea necesario
];

const Calendario = () => {
  const [myEvents, setMyEvents] = useState(events);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', start: '', end: '' });

  const handleSelectEvent = (event) => {
    Swal.fire({
      title: 'Evento',
      text: event.title,
      confirmButtonText: 'Cerrar'
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent({ ...newEvent, [name]: value });
  };

  const handleSubmit = () => {
    const { title, start, end } = newEvent;
    if (!title || !start || !end) {
      Swal.fire('Error', 'Todos los campos son obligatorios', 'error');
      return;
    }
    setMyEvents([...myEvents, {
      id: myEvents.length,
      title,
      start: new Date(start),
      end: new Date(end)
    }]);
    setModalIsOpen(false);
    Swal.fire('¡Evento creado!', '', 'success');
  };

  return (
    <div className="p-4 bg-secondary-100 min-h-screen">
      <h1 className="text-3xl text-center uppercase font-bold tracking-[5px] text-emi_amarillo mb-8">
        Calendario <span className="text-emi_azul">de Eventos</span>
      </h1>
      <div className="bg-white p-6 rounded-3xl shadow-2xl">
        <button 
          className="bg-emi_azul text-emi_amarillo py-2 px-4 rounded-lg hover:bg-black transition-colors mb-4"
          onClick={() => setModalIsOpen(true)}
        >
          Añadir Evento
        </button>
        <Calendar
          localizer={localizer}
          events={myEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          selectable
          onSelectEvent={handleSelectEvent}
        />
      </div>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '10px',
            padding: '20px',
            width: '400px',
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
          },
        }}
      >
        <h2 className="text-2xl text-center mb-4">Añadir Nuevo Evento</h2>
        <div className="flex flex-col">
          <label className="mb-2">Título</label>
          <input
            type="text"
            name="title"
            value={newEvent.title}
            onChange={handleInputChange}
            className="mb-4 p-2 border border-gray-300 rounded"
          />
          <label className="mb-2">Inicio</label>
          <input
            type="datetime-local"
            name="start"
            value={newEvent.start}
            onChange={handleInputChange}
            className="mb-4 p-2 border border-gray-300 rounded"
          />
          <label className="mb-2">Fin</label>
          <input
            type="datetime-local"
            name="end"
            value={newEvent.end}
            onChange={handleInputChange}
            className="mb-4 p-2 border border-gray-300 rounded"
          />
          <button
            onClick={handleSubmit}
            className="bg-emi_amarillo text-emi_azul py-2 px-4 rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors"
          >
            Guardar
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Calendario;
