### Build frontend using node (builder stage)
FROM node:18-alpine AS node_builder
WORKDIR /app

### Python runtime stage
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# system deps
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential curl \
    && rm -rf /var/lib/apt/lists/*

# upgrade pip
RUN pip install --no-cache-dir --upgrade pip

# copy requirements and install python deps
COPY ../requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# copy project source
COPY . /app/

# copy built frontend into STATIC_ROOT so Django/WhiteNoise can serve it
# The frontend build outputs into `_server/core/static` (per manual build),
# so copy from there into the image STATIC_ROOT.
# Copy the contents of the frontend build (the `core` folder) into Django's STATIC_ROOT
# so that files referenced as `/static/assets/...` resolve to /app/_server/staticfiles/assets/...
COPY _server/core/static/core/ /app/_server/staticfiles/

# make entrypoint executable
RUN chmod +x /app/_server/entrypoint.sh

EXPOSE 8000

CMD ["/app/_server/entrypoint.sh"]
