export const requireParams = (params: Record<string, any>) => {
  let errors = [];
  for (const [k, v] of Object.entries(params)) {
    if (!v) {
      errors.push({
        type: "invalid_request_error",
        code: "parameter_missing",
        message: `We expected a value for ${k}, but none was provided`,
        param: k,
      });
    }
  }
  return errors;
};
