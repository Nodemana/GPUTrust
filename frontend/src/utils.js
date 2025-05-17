
export default function getBenchmark() {
    const models = ["NVIDIA A100", "NVIDIA 4080", "NVIDIA 4080 TI", "NVIDIA H100", "NVIDIA 5090", "NVIDIA 2080 TI", "NVIDIA 2080", "AMD RX9000", "AMD 7800XT"];
    const avg_temp = Math.random() * 100;
    const max_temp = avg_temp + Math.random() * 100;
    const avg_fps = Math.random() * 100;
    const max_fps = avg_fps + Math.random() * 100;
    const mem_bw = Math.random() * 1000;
    const model = models[Math.floor(Math.random() * models.length)];

    const benchmark = {
        model: model,
        avg_temp: avg_temp,
        max_temp: max_temp,
        avg_fps: avg_fps,
        max_fps: max_fps,
        mem_bw: mem_bw
    };

    return benchmark
}
