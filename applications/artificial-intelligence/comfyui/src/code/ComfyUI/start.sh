#!/bin/bash
ln -s /mnt/ComfyUI/models models;
for subdir in $(ls models-tmp/); 
do
    if [ ! -d models/$subdir -a ! -f models/$subdir ]; then
        cp -r models-tmp/$subdir models/
    fi
done
python main.py --cpu