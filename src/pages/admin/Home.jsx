import React, { useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Modal, Button, Select, Form, Input, message } from "antd";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "antd/dist/reset.css";

const { Option } = Select;
const localizer = momentLocalizer(moment);

const Home = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableHours, setAvailableHours] = useState([]);
  const [selectedHour, setSelectedHour] = useState(null);
  const [appointments, setAppointments] = useState([]);

  // Horarios disponibles para cada día
  const hoursData = {
    "2024-08-14": ["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "03:00 PM"],
    "2024-08-15": ["10:00 AM", "12:00 PM", "02:00 PM", "04:00 PM"],
    "2024-08-16": ["08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM"],
  };

  // Fechas estáticas con citas ocupadas
  const events = [
    {
      title: "Cita Ocupada",
      start: new Date(2024, 7, 14, 10, 0),
      end: new Date(2024, 7, 14, 11, 0),
    },
    {
      title: "Cita Ocupada",
      start: new Date(2024, 7, 15, 14, 0),
      end: new Date(2024, 7, 15, 15, 0),
    },
    {
      title: "Cita Ocupada",
      start: new Date(2024, 7, 16, 9, 0),
      end: new Date(2024, 7, 16, 10, 0),
    },
  ];

  const handleSelectSlot = (slotInfo) => {
    const dateStr = moment(slotInfo.start).format("YYYY-MM-DD");
    if (hoursData[dateStr]) {
      setSelectedDate(dateStr);
      setAvailableHours(hoursData[dateStr]);
      setModalVisible(true);
    } else {
      toast.error("No hay horas disponibles para esta fecha.");
    }
  };

  const handleReserveAppointment = (values) => {
    const newAppointment = {
      title: `Cita con ${values.name}`,
      start: moment(`${selectedDate} ${selectedHour}`, "YYYY-MM-DD hh:mm A").toDate(),
      end: moment(`${selectedDate} ${selectedHour}`, "YYYY-MM-DD hh:mm A").add(1, 'hour').toDate(),
    };
    setAppointments([...appointments, newAppointment]);
    message.success("Cita reservada con éxito");
    setModalVisible(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
      <h2 className="mb-4">Sistema de Reserva de Citas</h2>
      <Calendar
        localizer={localizer}
        events={[...events, ...appointments]}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500, width: "80%" }}
        selectable={true}
        onSelectSlot={handleSelectSlot}
      />
      <Modal
        title="Reservar Cita"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form
          layout="vertical"
          onFinish={handleReserveAppointment}
        >
          <Form.Item
            name="name"
            label="Nombre del Cliente"
            rules={[{ required: true, message: 'Por favor ingrese el nombre del cliente' }]}
          >
            <Input placeholder="Nombre del Cliente" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Correo Electrónico"
            rules={[{ required: true, message: 'Por favor ingrese el correo electrónico' }]}
          >
            <Input placeholder="Correo Electrónico" />
          </Form.Item>
          <Form.Item
            name="hour"
            label="Seleccione la Hora"
            rules={[{ required: true, message: 'Por favor seleccione una hora' }]}
          >
            <Select
              placeholder="Seleccione una hora"
              onChange={setSelectedHour}
            >
              {availableHours.map((hour, index) => (
                <Option key={index} value={hour}>
                  {hour}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="service"
            label="Seleccione el Servicio"
            rules={[{ required: true, message: 'Por favor seleccione un servicio' }]}
          >
            <Select placeholder="Seleccione un Servicio">
              <Option value="consulta">Consulta General</Option>
              <Option value="limpieza">Limpieza Dental</Option>
              <Option value="ortodoncia">Ortodoncia</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Reservar
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <ToastContainer />
    </div>
  );
};

export default Home;
