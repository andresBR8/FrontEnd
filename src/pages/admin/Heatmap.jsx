import React from 'react';
import { HeatMapGrid } from 'react-grid-heatmap';

const Heatmap = ({ data }) => {
  const unidades = [...new Set(data.map(assignment => assignment.personal.unidad?.nombre))].filter(Boolean);
  const unitCounts = unidades.map(unidad => ({
    name: unidad,
    count: data.filter(assignment => assignment.personal.unidad?.nombre === unidad).length
  }));

  const xLabels = unitCounts.map(unit => unit.name);
  const yLabels = ['Activos'];

  const heatmapData = [
    unitCounts.map(unit => unit.count)
  ];

  return (
    <div>
      <HeatMapGrid
        data={heatmapData}
        xLabels={xLabels}
        yLabels={yLabels}
        cellStyle={(_x, _y, ratio) => ({
          background: `rgba(165, 0, 38, ${ratio})`,
          fontSize: ".8rem"
        })}
        cellRender={value => value && `${value}`}
      />
    </div>
  );
};

export default Heatmap;
