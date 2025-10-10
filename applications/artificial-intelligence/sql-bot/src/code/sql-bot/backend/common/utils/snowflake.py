import time
import threading
class SnowflakeGenerator:
    def __init__(self, worker_id=0, datacenter_id=0):
        self.worker_id = worker_id
        self.datacenter_id = datacenter_id
        self.sequence = 0
        self.last_timestamp = -1
        self.lock = threading.Lock()

        self.worker_id_bits = 5
        self.datacenter_id_bits = 5
        self.max_worker_id = -1 ^ (-1 << self.worker_id_bits)
        self.max_datacenter_id = -1 ^ (-1 << self.datacenter_id_bits)
        self.sequence_bits = 12

        self.worker_id_shift = self.sequence_bits
        self.datacenter_id_shift = self.sequence_bits + self.worker_id_bits
        self.timestamp_left_shift = self.sequence_bits + self.worker_id_bits + self.datacenter_id_bits
        self.sequence_mask = -1 ^ (-1 << self.sequence_bits)

        if self.worker_id > self.max_worker_id or self.worker_id < 0:
            raise ValueError(f"worker ID can't be greater than {self.max_worker_id} or less than 0")
        if self.datacenter_id > self.max_datacenter_id or self.datacenter_id < 0:
            raise ValueError(f"datacenter ID can't be greater than {self.max_datacenter_id} or less than 0")

    def _current_time(self):
        return int(time.time() * 1000)

    def _wait_next_millis(self, last_timestamp):
        timestamp = self._current_time()
        while timestamp <= last_timestamp:
            timestamp = self._current_time()
        return timestamp

    def generate_id(self):
        with self.lock:
            timestamp = self._current_time()

            if timestamp < self.last_timestamp:
                raise ValueError("Clock moved backwards. Refusing to generate ID")

            if timestamp == self.last_timestamp:
                self.sequence = (self.sequence + 1) & self.sequence_mask
                if self.sequence == 0:
                    timestamp = self._wait_next_millis(self.last_timestamp)
            else:
                self.sequence = 0

            self.last_timestamp = timestamp

            return ((timestamp << self.timestamp_left_shift) |
                    (self.datacenter_id << self.datacenter_id_shift) |
                    (self.worker_id << self.worker_id_shift) |
                    self.sequence)

snowflake = SnowflakeGenerator(worker_id=1)