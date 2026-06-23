#!/bin/bash
docker system prune -f --volumes
docker builder prune -f
