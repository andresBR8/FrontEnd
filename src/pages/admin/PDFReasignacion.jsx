import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Define tus estilos
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 12,
  },
  logo: {
    width: 150,
    height: 50,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  details: {
    marginBottom: 10,
  },
  fecha: {
    fontSize: 12,
    textAlign: 'right',
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
    flexDirection: 'row',
  },
  tableColHeader: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#f3f3f3',
    textAlign: 'center',
    padding: 5,
  },
  tableCol: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    textAlign: 'center',
    padding: 5,
  },
  tableCell: {
    margin: 'auto',
    fontSize: 10,
  },
  tableCellLeft: {
    margin: 'auto',
    fontSize: 10,
    textAlign: 'left',
  },
  footer: {
    marginTop: 10,
    fontSize: 12,
    textAlign: 'justify',
  },
  signSpace: {
    marginTop: 20,
    fontSize: 12,
  },
  signRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
    borderTop: '1px solid black',
    paddingTop: 10,
  },
});

const formatDate = (date) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(date).toLocaleDateString('es-ES', options);
};

const base64Logo = "data:image/png;base64,..."; // Incluye aquí el base64 del logo si es necesario

const ReasignacionDocument = ({ data }) => {
  const fechaActual = formatDate(new Date());

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Image style={styles.logo} src={base64Logo} />
        <Text style={styles.title}>DOCUMENTO DE REASIGNACIÓN</Text>
        <View style={styles.details}>
          <Text>Nombre: {data.nombre}</Text>
          <Text>Cargo: {data.cargo}</Text>
          <Text>Unidad: {data.unidad}</Text>
        </View>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            
            <View style={{...styles.tableColHeader, width: '20%'}}><Text style={styles.tableCell}>Usuario Anterior</Text></View>
            <View style={{...styles.tableColHeader, width: '20%'}}><Text style={styles.tableCell}>Usuario Nuevo</Text></View>
          </View>
          {data.activos.map((activo, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={{...styles.tableCol, width: '20%'}}><Text style={styles.tableCellLeft}>{activo.usuarioAnterior}</Text></View>
              <View style={{...styles.tableCol, width: '20%'}}><Text style={styles.tableCellLeft}>{activo.usuarioNuevo}</Text></View>
            </View>
          ))}
        </View>
        <View style={{ height: 20 }}></View>
        <Text style={styles.fecha}>Cochabamba, {fechaActual}</Text>
        <View style={{ height: 10 }}></View>
        <Text style={styles.footer}>
          Activo(s) que se hace entrega según se estipula en los artículos 146, 147, 156 y 157 del D.S. 0181 y de los artículos 28 y 31 de la Ley 1178
        </Text>
        <Text style={styles.footer}>
          Nota: La asignación de bienes genera en el servidor público la consiguiente responsabilidad sobre el debido uso, custodia y mantenimiento de los mismos. La pérdida, destrucción o maltrato será atribuida al funcionario público a cargo de los bienes. Asimismo, el funcionario que tiene a su cargo bienes de la institución por ningún motivo podrá efectuar préstamo y/o transferencia por cuenta propia.
        </Text>
        <Text style={styles.footer}>
          SE ENTREGO CONFORME
        </Text>
        <View style={styles.signRow}>
          <Text style={styles.signSpace}>ACTIVOS FIJOS</Text>
          <Text style={styles.signSpace}>FUNCIONARIO RESPONSABLE</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ReasignacionDocument;
