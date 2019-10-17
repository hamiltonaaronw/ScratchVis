#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

in vec2 oTexCoord;

uniform float uFreq;
uniform float uLastFreq;
uniform float uDeltaFreq;

uniform float uTime;
uniform float uDeltaTime;

uniform vec2 uRes;

uniform float[256] uSpectrum;

out vec4 retColor;

float sinc(float x)
{
	float ret = sin(x) / x;
	return ret;
}

float cosc(float x)
{
	float ret = cos(x) / x;
	return ret;
}

float hash(vec2 p, in float s)
{
	vec3 p2 = vec3(p.xy, 27.0 * abs(sinc(s)));
	float ret = fract(sin(dot(p2, vec3(27.1, 61.7, 12.4)))* 2.1);
	return ret;
}

float noise(vec2 p, float s)
{
	vec2 i = floor(p);
	vec2 f = fract(p);
	f *= f * (3.0 - 2.0 * f);

	float m1 = mix(hash(i + vec2(0.0, 0.0), s), hash(i + vec2(1.0, 0.0), s), f.x);
	float m2 = mix(hash(i + vec2(0.0, 1.0), s), hash(i + vec2(1.0, 1.0), s), f.x);

	float ret = mix(m1, m2, f.y) * s;
	return ret;
}

float fbm(vec2 p)
{
	float v = 0.0;
	v += noise(p * 1.0, 0.35);
	v += noise(p * 2.0, 0.25);
	v += noise(p * 8.0, 0.0625);

	float ret = v;
	return ret;
}

vec3 col(vec2 p, float mult)
{
	float c = 20.0;

	p.x *= uRes.x / uRes.y;

	float f = min(uFreq, uLastFreq) + abs(uDeltaFreq / 2.0);
	float ft = smoothstep(uTime, uFreq, f);
	float tf = uTime / f;
	ft *= sinc(cosc(tf / length(oTexCoord)));
	f += smoothstep(max(ft, tf), min(tf, ft), 1.0 / f);


	float wt = uTime * (ft / f);
	float ts =(uTime * f) / smoothstep(max(uTime, f), min(uTime, f), sin(uFreq));
	ts *= (1.0 / wt) * f;

	float lp = length(p) / 100.0;
	float dp = dot(p, p);

	vec3 fc = vec3(sinc(ft) * 0.01);
	for (float i = 1.0; i <= c; ++i)
	{
		float sp = uSpectrum[int(mod(floor(i * 10.56) + p.x, 256.0))] / 10.0;
		float t = abs(i * uFreq / ((p.x + fbm(p + ts - sin(f * i * uFreq + sin(p.x / uTime * sp)))) * (i * f)));

		t *= pow(sin(lp), 2.0) * (uFreq / lp * sin(f));
		t /= 5.0;

		fc += t * vec3(
						((uFreq * i * lp) * ft) + sinc(p.x),
						(sinc((i / ft)) / lp / f) ,
						(f / (i / uFreq) / lp)
					   );

		fc *= sin(uTime * uFreq * sin(sp));
	}

	vec3 ret = fc * f * 15.0;
	return ret;
}

vec3 cols(vec2 p)
{
	vec3 ret = vec3(0);

	for (float i = 0; i < 8; i++)
	{
		int j = (256 /  8) * int(i);
		float sum = 0.0;
		for (int k = j; k < j + 31; k++)	
			if (k < 256)
				sum += uSpectrum[k];

		float avg = sum / 32.0;
		float b = abs(abs(sin(avg) - cos(avg)) - abs(sin(uFreq) - cos(uFreq)));
		b *= (i + 1.0);
		float con = sin(uTime * i) * (uFreq * j);
		if (b >= con)
		{
			p = (gl_FragCoord.xy / uRes.xy) * PI - (0.5 + i);
			float m = avg + i;

			ret += col(p, m);
		}
	}

	return ret;
}

void main()
{
	vec4 ret;
	vec2 uv;

	uv = (gl_FragCoord.xy / uRes.xy) * 2.0 - 0.5;// - 1.0;
	ret = vec4(cols(uv), 1.0);

	retColor = ret;
}