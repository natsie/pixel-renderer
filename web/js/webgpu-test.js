export default async function WebGPUTest() {
  const adapter = await navigator.gpu?.requestAdapter();
  const device = await adapter?.requestDevice();
  if (!device) {
    console.error("Failed to acquire GPU device.")
    return;
  }

  console.log(device)
}