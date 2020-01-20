module.exports = (payload, templateobject) => {
  const validationErrors = []
  for (const property in templateobject) {
    const expected = templateobject[property]
    if (payload[property] !== undefined) {
      /* eslint valid-typeof: "error" */
      if (expected.type && typeof (payload[property]) !== expected.type) {
        validationErrors[validationErrors.length++] = expected.error || `Validation failed for ${property}`
        break
      }
      if (expected.reg && !expected.reg.test(payload[property])) {
        validationErrors[validationErrors.length++] = expected.error || `Validation failed for ${property}`
        break
      }
    } else {
      validationErrors[validationErrors.length++] = expected.error || `Validation failed for ${property}`
    }
  }
  return validationErrors
}
