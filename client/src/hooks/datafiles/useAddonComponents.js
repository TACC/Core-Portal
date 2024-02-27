import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

function useAddonComponents({ portalName }) {
    const [addonComponents, setAddonComponents] = useState({});
    const hasAddons = useSelector(state => state.workbench.config.hasAddons);
    useEffect(() => {
        const loadAddonComponents = async () => {
            try {
                const addOns = {};
                for (const addOnName of hasAddons) {
                    const module = await import(`../../components/_custom/${portalName}/${addOnName}/${addOnName}.jsx`);
                    addOns[addOnName] = module.default;
                }
                setAddonComponents(addOns);
            } catch (error) {
                console.error('Error loading addon components:', error);
            }
        };

        if (hasAddons) {
            loadAddonComponents();
        }
    }, []);
    console.log("truuu", addonComponents)
    return addonComponents;
}

export default useAddonComponents;