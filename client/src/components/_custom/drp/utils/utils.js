export const getTooltipDescription = (key) => {
  switch (key) {
    case 'sample':
      return 'A sample of a porous material. It can be a core, fibrous material, fuel cell, etc.';
    case 'digital_dataset':
      return 'All images corresponding to the sample, that do not contain any analysis results. One expectation is segmentation, which can be included in the digital dataset.';
    case 'analysis_dataset':
      return 'Analysis datasets are connected to "Sample" entities. They can also be linked to "Digital Dataset" entities if the analysis is conducted on the digital dataset.';
    default:
      return key;
  }
};
