import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import coreMetadataAddons from '../../components/DataFiles/addons';

const useAddonComponents = ({ portalName }) => {
  const [addonComponents, setAddonComponents] = useState({});
  const addons = useSelector((state) => state.workbench.config.addons);
  const { metadata } = useSelector((state) => state.projects);

  const shouldLoadComponents = useMemo(
    () => addons && metadata.projectId !== 'community',
    [addons, metadata.projectId]
  );

  useEffect(() => {
    if (!shouldLoadComponents) {
      setAddonComponents({});
      return;
    }

    // Resolve each requested addon to the portal's override under
    // _custom/<portal>/, falling back to the core default for that slot.
    const loadAddon = async (addonName) => {
      try {
        const module = await import(
          `../../components/_custom/${portalName.toLowerCase()}/${addonName}/${addonName}.jsx`
        );
        return module.default;
      } catch {
        return coreMetadataAddons[addonName];
      }
    };

    const loadAddonComponents = async () => {
      const resolved = await Promise.all(addons.map(loadAddon));
      const components = addons.reduce((acc, addonName, index) => {
        if (resolved[index]) {
          acc[addonName] = resolved[index];
        }
        return acc;
      }, {});
      setAddonComponents(components);
    };

    loadAddonComponents();
  }, [shouldLoadComponents, portalName]);

  return addonComponents;
};

export default useAddonComponents;
