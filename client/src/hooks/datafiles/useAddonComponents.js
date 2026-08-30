import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

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

    const loadAddonComponents = async () => {
      try {
        const modules = await Promise.all(
          addons.map((addonName) =>
            import(
              `../../components/_custom/${portalName.toLowerCase()}/${addonName}/${addonName}.jsx`
            )
          )
        );

        const components = modules.reduce((acc, module, index) => {
          acc[addons[index]] = module.default;
          return acc;
        }, {});

        setAddonComponents(components);
      } catch (error) {
        console.error('Error loading addon components:', error);
      }
    };

    loadAddonComponents();
  }, [shouldLoadComponents, portalName]);

  return addonComponents;
};

export default useAddonComponents;
