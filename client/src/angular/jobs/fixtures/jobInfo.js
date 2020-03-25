const jobInfo = {
    "inputs": {
        "fastq2": "agave://utrc.storage.community/examples/kallisto/reads_2.fastq.gz",
        "fasta": "agave://utrc.storage.community/examples/kallisto/transcripts.fasta.gz",
        "fastq1": "agave://utrc.storage.community/examples/kallisto/reads_1.fastq.gz"
    },
    "parameters": {
        "output": "output",
        "seed": 42
    },
    "maxRunTime": "01:00:00",
    "allocation": "A-ccsc",
    "name": "kallisto-0.45.0u3-3.0_2019-08-09T16:58:15",
    "nodeCount": 1,
    "processorsPerNode": 24
}

export { jobInfo }