/**
 * OptimizationRequest — a named property bag for a single optimizer run.
 * Intentionally declares no fields here: OptimizerTab.getOptimizationRequestParams()
 * instantiates one and populates it dynamically (input* filters, stat min/max limits,
 * set/main-stat filters, target priorities, …), then it's serialized and POSTed to the
 * Java backend via Api.submitOptimizationRequest.
 */
class OptimizationRequest {}

export default OptimizationRequest;
