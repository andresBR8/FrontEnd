import React, { useState, useEffect } from "react";
import axios from "axios";
import { RiCloseLine } from "react-icons/ri";
import moment from "moment-timezone";
import QRCode from "qrcode.react"; // Asegúrate de tener instalada la librería `qrcode.react`

const DetalleActivo = ({ activo, onClose }) => {
  const [partida, setPartida] = useState("");
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (activo.fk_Partida) {
      axios.get(`${apiUrl}/api/Partidas/${activo.fk_Partida}`)
        .then(response => setPartida(response.data.nombre))
        .catch(error => console.error('Error fetching partida:', error));
    }
  }, [activo.fk_Partida]);

  const handleDownloadQR = () => {
    const canvas = document.getElementById("qrCode");
    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `${activo.id}_QRCode.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div className="relative bg-secondary-100 p-8 rounded-3xl shadow-2xl w-[800px] lg:w-[1000px]">
        <button
          onClick={onClose}
          className="absolute top-0 right-0 text-2xl p-2 text-primary hover:text-white"
          aria-label="Cerrar"
        >
          <RiCloseLine />
        </button>
        <h1 className="text-3xl text-center uppercase font-bold tracking-[5px] text-white mb-8">
          Detalle <span className="text-primary">Activo</span>
        </h1>
        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col text-white">
            <strong>ID:</strong> {activo.id}
          </div>
          <div className="flex flex-col text-white">
            <strong>Partida:</strong> {partida}
          </div>
          <div className="flex flex-col text-white">
            <strong>Descripción:</strong> {activo.detalle}
          </div>
          <div className="flex flex-col text-white">
            <strong>Fecha de Ingreso:</strong> {moment(activo.fechaIngreso).tz('America/La_Paz').format('YYYY-MM-DD')}
          </div>
          <div className="flex flex-col text-white">
            <strong>Valor/Costo:</strong> {activo.costo}
          </div>
          <div className="flex flex-col text-white">
            <strong>Estado:</strong> {activo.estado}
          </div>
          <div className="flex flex-col text-white">
            <strong>Asignado:</strong> {activo.asignado ? "Sí" : "No"}
          </div>
          <div className="flex flex-col text-white col-span-2">
            <strong>Orden de Compra:</strong>
            {activo.ordenCompra && (
              activo.ordenCompra.endsWith(".pdf") ? (
                <embed
                  src={activo.ordenCompra}
                  type="application/pdf"
                  width="100%"
                  height="500px"
                />
              ) : (
                <img
                  src={activo.ordenCompra}
                  alt="Orden de Compra"
                  className="w-full h-auto mt-4 rounded-lg shadow-md"
                />
              )
            )}
          </div>
          <div className="flex flex-col text-white">
            <strong>Código QR:</strong>
            <div className="flex items-center justify-center mt-4">
              <QRCode
                id="qrCode"
                value={JSON.stringify(activo)}
                size={128}
                level={"H"}
                includeMargin={true}
              />
            </div>
            <button
              onClick={handleDownloadQR}
              className="bg-primary text-black uppercase font-bold text-sm w-full py-3 px-4 mt-4 rounded-lg"
            >
              Descargar QR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalleActivo;
