/**
 * Hook de Proteção de Formulários
 * 
 * Avisa o usuário antes de sair de uma página com formulário não salvo.
 * Previne perda acidental de dados.
 * 
 * Uso:
 * ```tsx
 * const [isDirty, setIsDirty] = useState(false);
 * useFormProtection(isDirty);
 * 
 * // Quando usuário modificar formulário:
 * setIsDirty(true);
 * 
 * // Após salvar:
 * setIsDirty(false);
 * ```
 */

import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';
import { getAppConfig } from '../config/appConfig';

export const useFormProtection = (isDirty: boolean) => {
  const config = getAppConfig();

  // Bloquear navegação se formulário não foi salvo
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      config.warnOnUnsavedForm &&
      isDirty &&
      currentLocation.pathname !== nextLocation.pathname
  );

  // Avisar ao fechar aba/navegador
  useEffect(() => {
    if (!config.warnOnUnsavedForm || !isDirty) {
      return;
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Você tem alterações não salvas. Tem certeza que deseja sair?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, config.warnOnUnsavedForm]);

  return {
    blocker,
    confirmNavigation: () => {
      if (blocker.state === 'blocked') {
        const confirmed = window.confirm(
          'Você tem alterações não salvas. Se sair, perderá tudo. Tem certeza?'
        );
        
        if (confirmed && blocker.proceed) {
          blocker.proceed();
        } else if (blocker.reset) {
          blocker.reset();
        }
      }
    },
  };
};
