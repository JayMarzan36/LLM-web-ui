from django.db import models
from django.contrib.auth.models import User
# Create your models here.


class Chats(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    model_name = models.CharField(max_length=100)
    content = models.TextField()
