import { useCallback, useReducer } from 'react';
import type { ChangeEvent } from 'react';

type FieldValue = string | boolean | string[];
type FormValues = Record<string, FieldValue>;
type FormErrors<V> = Partial<Record<keyof V, string>>;

interface State<V> {
  values: V;
  touched: Partial<Record<keyof V, boolean>>;
}

type Action<V> =
  | { type: 'change'; name: keyof V; value: V[keyof V] }
  | { type: 'blur'; name: keyof V }
  | { type: 'touchAll' }
  | { type: 'fill'; values: Partial<V> };

function reducer<V extends FormValues>(state: State<V>, action: Action<V>): State<V> {
  switch (action.type) {
    case 'change':
      return { ...state, values: { ...state.values, [action.name]: action.value } };
    case 'blur':
      return { ...state, touched: { ...state.touched, [action.name]: true } };
    case 'touchAll': {
      const touched: State<V>['touched'] = {};
      for (const name of Object.keys(state.values) as (keyof V)[]) {
        touched[name] = true;
      }
      return { ...state, touched };
    }
    case 'fill':
      return { ...state, values: { ...state.values, ...action.values } };
  }
}

// Formularios controlados: el valor de cada input vive en el estado de React (values) y
// cada tecla lo actualiza con onChange. `validate` recibe los valores y devuelve un texto de
// error por campo. Los errores no se guardan: se calculan en cada render a partir de values.
export function useForm<V extends FormValues>(
  initialValues: V,
  validate: (values: V) => FormErrors<V>,
) {
  const [state, dispatch] = useReducer(reducer<V>, { values: initialValues, touched: {} });

  const errors = validate(state.values);
  const isValid = Object.keys(errors).length === 0;

  // Sirve para input, select y textarea. Se enlaza con el atributo `name` del campo
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const target = e.target;
    let value: FieldValue;

    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      value = target.checked;
    } else if (target instanceof HTMLSelectElement && target.multiple) {
      value = Array.from(target.selectedOptions).map((option) => option.value);
    } else {
      value = target.value;
    }

    dispatch({ type: 'change', name: target.name as keyof V, value: value as V[keyof V] });
  };

  // onBlur: el campo se marca como "tocado" al salir de él, y solo entonces se enseña su error
  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => dispatch({ type: 'blur', name: e.target.name as keyof V });

  // useCallback: dispatch es estable, así que estas dos funciones también lo son y se pueden
  // poner en las dependencias de un useEffect sin que se repita en cada render
  const touchAll = useCallback(() => dispatch({ type: 'touchAll' }), []);
  const fill = useCallback((values: Partial<V>) => dispatch({ type: 'fill', values }), []);

  return {
    values: state.values,
    errors,
    isValid,
    // Error de un campo, pero solo si ya se ha tocado (o si se ha intentado enviar)
    errorOf: (name: keyof V) => (state.touched[name] ? errors[name] : undefined),
    handleChange,
    handleBlur,
    touchAll,
    fill,
  };
}
